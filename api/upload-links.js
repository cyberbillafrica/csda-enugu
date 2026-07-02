// api/upload-links.js
module.exports = async function handler(req, res) {
  console.log("=== API CALLED ===");
  console.log("Method:", req.method);
  console.log("Env GOOGLE_SERVICE_ACCOUNT_EMAIL:", !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  console.log("Env GOOGLE_PRIVATE_KEY length:", process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({ 
    success: true, 
    message: "API is working - Debug Mode",
    received: req.body
  });
};