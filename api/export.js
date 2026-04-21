export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { scriptId, payload } = req.body;

  if (!scriptId) {
    return res.status(400).json({ error: 'Missing scriptId' });
  }

  const webhookUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  
  console.log(`[API Export] Forwarding data to Google Script: ${scriptId}`);
  console.log(`[API Export] Payload rows: ${payload?.rows?.length || 0}`);

  try {
    // 2. Perform the request from the Vercel server
    // This avoids CORS, preflight, and redirect issues in the browser
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // 3. Get the response text
    const responseText = await response.text();
    console.log(`[API Export] Google Response Status: ${response.status}`);

    // 4. Return the result to the frontend
    // If it's JSON, send it as JSON, otherwise send as text
    try {
      const jsonData = JSON.parse(responseText);
      return res.status(200).json(jsonData);
    } catch (e) {
      // If it contains "success", return a success object
      if (responseText.toLowerCase().includes('success') || responseText.toLowerCase().includes('ok')) {
        return res.status(200).json({ status: 'success', message: responseText });
      }
      return res.status(200).json({ status: 'raw', data: responseText });
    }
  } catch (error) {
    console.error('[API Export] Fatal Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
