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
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Create a file with metadata first (this is more reliable)
    const fileMetadata = {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: mimeType,
    };

    const { data: file } = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    // Make it public
    await drive.permissions.create({
      fileId: file.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const publicUrl = `https://drive.google.com/file/d/${file.id}/view`;

    res.status(200).json({
      success: true,
      driveUploadUrl: null, // Not needed for simple upload
      fileId: file.id,
      publicUrl: publicUrl,
    });

  } catch (error) {
    console.error('Upload link generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate upload link',
      details: error.message 
    });
  }
}