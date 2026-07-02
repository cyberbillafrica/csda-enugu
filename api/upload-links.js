// api/upload-links.js
import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { filename, mimeType, fileSize } = req.body;

    if (!filename || !mimeType) {
        return res.status(400).json({
            error: 'filename and mimeType are required'
        });
    }

    try {
        // ======================
        // Validate environment variables
        // ======================
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
            throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing');
        }

        if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
            throw new Error('GOOGLE_DRIVE_FOLDER_ID is missing');
        }

        // ======================
        // Parse Service Account JSON
        // ======================
        const credentials = JSON.parse(
            process.env.GOOGLE_SERVICE_ACCOUNT_JSON
        );

        // ======================
        // Google Auth
        // ======================
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: [
                'https://www.googleapis.com/auth/drive.file'
            ],
        });

        const drive = google.drive({
            version: 'v3',
            auth,
        });

        // ======================
        // Create resumable upload session
        // ======================
        const response = await drive.files.create(
            {
                requestBody: {
                    name: filename,
                    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
                },
                media: {
                    mimeType,
                },
                fields: 'id, webViewLink',
            },
            {
                uploadType: 'resumable',
            }
        );

        const uploadUrl = response.headers.location;

        if (!uploadUrl) {
            throw new Error('Failed to generate resumable upload URL');
        }

        return res.status(200).json({
            success: true,
            driveUploadUrl: uploadUrl,
            message: 'Upload link generated successfully',
        });

    } catch (error) {
        console.error('Upload link generation error:', error);

        return res.status(500).json({
            error: 'Failed to generate upload link',
            details: error.message,
        });
    }
}