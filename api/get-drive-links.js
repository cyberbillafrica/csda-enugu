// api/get-drive-links.js
import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { filenames } = req.body;

    if (!filenames || !Array.isArray(filenames)) {
        return res.status(400).json({ error: 'filenames array is required' });
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const links = [];

        for (const filename of filenames) {
            // Find the file by name
            const searchRes = await drive.files.list({
                q: `name='${filename}' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive',
            });

            const file = searchRes.data.files[0];
            if (!file) {
                links.push(null);
                continue;
            }

            // Make file publicly accessible
            await drive.permissions.create({
                fileId: file.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });

            // Get the public link
            const publicLink = `https://drive.google.com/file/d/${file.id}/view`;
            links.push(publicLink);
        }

        res.status(200).json({
            success: true,
            links: links
        });

    } catch (error) {
        console.error('Get Drive Links Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate public links',
            details: error.message 
        });
    }
}