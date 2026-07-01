// api/upload-links.js
import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { filename, mimeType, fileSize } = req.body;

    if (!filename || !mimeType) {
        return res.status(400).json({ error: 'filename and mimeType are required' });
    }

    try {
        // ====================== GOOGLE DRIVE ======================
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // Create resumable upload session
        const response = await drive.files.create({
            requestBody: {
                name: filename,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
            },
            media: {
                mimeType: mimeType,
            },
            fields: 'id, webViewLink',
        }, {
            // This is important for resumable upload
            uploadType: 'resumable',
        });

        const uploadUrl = response.headers.location;

        if (!uploadUrl) {
            throw new Error('Failed to get resumable upload URL');
        }

        // ====================== MEGA (Future / Secondary) ======================
        // For now, we'll focus on Google Drive as primary
        // MEGA client-side upload is complex and not ideal for large files on Vercel

        res.status(200).json({
            success: true,
            driveUploadUrl: uploadUrl,
            message: "Upload to Google Drive prepared successfully",
            // You can add MEGA logic later as a background job
        });

    } catch (error) {
        console.error('Upload link generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate upload link',
            details: error.message 
        });
    }
}