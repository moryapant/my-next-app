import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

type FormidableParseResult = [formidable.Fields, formidable.Files];

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

    const [, files] = await new Promise<FormidableParseResult>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          reject(err);
        }
        resolve([fields, files]);
      });
    });

    // Handle file upload
    const fileArray = files.file as File[];
    const uploadedFile = fileArray?.[0];
    if (!uploadedFile) {
      console.error('No file received');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${uploadedFile.originalFilename}`;
    const newPath = path.join(uploadDir, fileName);

    try {
      // Rename file to include timestamp
      fs.renameSync(uploadedFile.filepath, newPath);

      // Return the URL for the uploaded file
      const fileUrl = `/uploads/${path.basename(newPath)}`;
      return res.status(200).json({ url: fileUrl });
    } catch (err) {
      console.error('Error moving file:', err);
      // Clean up the uploaded file
      if (fs.existsSync(uploadedFile.filepath)) {
        fs.unlinkSync(uploadedFile.filepath);
      }
      return res.status(500).json({ error: 'Error processing file' });
    }
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Error uploading file' });
  }
} 