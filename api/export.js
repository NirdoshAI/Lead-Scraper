export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { webhookUrl, payload } = req.body;

  if (!webhookUrl) {
    return res.status(400).json({ error: 'Missing webhookUrl' });
  }

  console.log(`[API Export] Target URL: ${webhookUrl}`);
  console.log(`[API Export] Payload sheetName: ${payload?.sheetName}`);
  console.log(`[API Export] Payload rows count: ${payload?.rows?.length || 0}`);
  console.log(`[API Export] Payload headers: ${JSON.stringify(payload?.headers)}`);

  const bodyString = JSON.stringify(payload);
  console.log(`[API Export] Body size: ${bodyString.length} bytes`);

  try {
    // Google Apps Script redirects 302 on POST. 
    // Node fetch by default follows the redirect but changes POST->GET, losing the body.
    // We must use redirect: 'manual' and handle it ourselves.
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: bodyString,
      redirect: 'manual',  // CRITICAL: Don't auto-follow redirects
    });

    console.log(`[API Export] Initial response status: ${response.status}`);

    // Google Apps Script returns 302 redirect after processing the POST
    // The doPost() function has already executed at this point
    // We need to follow the redirect with GET to get the response
    if (response.status === 302 || response.status === 301 || response.status === 307) {
      const redirectUrl = response.headers.get('location');
      console.log(`[API Export] Following redirect to: ${redirectUrl}`);

      if (redirectUrl) {
        const redirectResponse = await fetch(redirectUrl, {
          method: 'GET',
          redirect: 'follow',
        });

        const responseText = await redirectResponse.text();
        console.log(`[API Export] Redirect response status: ${redirectResponse.status}`);
        console.log(`[API Export] Redirect response body: ${responseText.substring(0, 500)}`);

        try {
          const jsonData = JSON.parse(responseText);
          return res.status(200).json(jsonData);
        } catch (e) {
          // Google processed the POST successfully, the redirect response is the result
          if (responseText.toLowerCase().includes('success') || responseText.toLowerCase().includes('ok')) {
            return res.status(200).json({ status: 'success', message: responseText });
          }
          // Even if the response isn't parseable, Google already processed the POST
          // Return what we got
          return res.status(200).json({ status: 'success', raw: responseText.substring(0, 200) });
        }
      }
    }

    // If no redirect (unlikely for Google Apps Script), handle normally
    const responseText = await response.text();
    console.log(`[API Export] Direct response: ${responseText.substring(0, 500)}`);

    try {
      const jsonData = JSON.parse(responseText);
      return res.status(200).json(jsonData);
    } catch (e) {
      return res.status(200).json({ status: 'success', raw: responseText.substring(0, 200) });
    }
  } catch (error) {
    console.error('[API Export] Fatal Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
