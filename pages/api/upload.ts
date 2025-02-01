import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          reject(err);
        }
        resolve([fields, files]);
      });
    });

    // Handle file upload
    const uploadedFile = files.file?.[0] || files.file; // Handle both array and single file cases
    if (!uploadedFile) {
      console.error('No file received');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${uploadedFile.originalFilename}`;
    const newPath = path.join(uploadDir, fileName);

    try {
      // Move the file
      await fs.promises.rename(uploadedFile.filepath, newPath);

      // Return the URL
      return res.status(200).json({
        url: `/uploads/${fileName}`,
      });
    } catch (moveError) {
      console.error('Error moving file:', moveError);
      // Cleanup if move fails
      if (fs.existsSync(uploadedFile.filepath)) {
        fs.unlinkSync(uploadedFile.filepath);
      }
      throw moveError;
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to upload file' 
    });
  }
} 