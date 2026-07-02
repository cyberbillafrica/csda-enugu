// api/upload-links.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename, mimeType } = req.body;

  if (!filename || !mimeType) {
    return res.status(400).json({ error: 'filename and mimeType are required' });
  }

  try {
    // Parse the full JSON from environment variable
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: mimeType,
      },
      fields: 'id',
    }, {
      uploadType: 'resumable',
    });

    const uploadUrl = response.headers.location;

    if (!uploadUrl) {
      throw new Error('Failed to get resumable upload URL');
    }

    res.status(200).json({
      success: true,
      driveUploadUrl: uploadUrl,
    });

  } catch (error) {
    console.error('Upload link generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate upload link',
      details: error.message 
    });
  }
}