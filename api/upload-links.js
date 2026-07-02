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

  // Note: For actual upload, we need the file in the request body
  // This version expects the file to be sent as binary in the request
  // But for simplicity, we'll assume the client uploads directly using the resumable URL.

  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const { headers } = await drive.files.create({
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

    const uploadUrl = headers.location || headers.Location;

    if (!uploadUrl) {
      throw new Error('No resumable upload URL');
    }

    res.status(200).json({
      success: true,
      driveUploadUrl: uploadUrl,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}