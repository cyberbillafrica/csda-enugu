// api/upload-links.js
export default async function handler(req, res) {
  console.log("API was called successfully");
  console.log("Request body:", req.body);

  res.status(200).json({ 
    success: true, 
    message: "API is working - Basic test",
    driveUploadUrl: "https://test-upload-url.com" 
  });
}