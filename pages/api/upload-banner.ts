import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
    },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'banners');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Ensure upload directory exists
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        const form = formidable({
            uploadDir,
            keepExtensions: true,
            maxFileSize: 5 * 1024 * 1024, // 5MB
            filename: (_name, ext) => {
                // Generate a unique filename
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                return `banner-${uniqueSuffix}${ext}`;
            }
        });

        // Parse the form data and get only the files
        const files = await new Promise<formidable.Files>((resolve, reject) => {
            form.parse(req, (err, _fields, files) => {
                if (err) reject(err);
                resolve(files);
            });
        });

        const file = files.file?.[0];
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate relative URL for the uploaded file
        const fileName = path.basename(file.filepath);
        const imageUrl = `/uploads/banners/${fileName}`;

        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error handling upload:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
} 