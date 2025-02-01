import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set JSON content type
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { image, fileName, directory } = req.body;

    // Validate input
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data is required' });
    }
    if (!fileName) {
      return res.status(400).json({ success: false, message: 'File name is required' });
    }
    if (!directory) {
      return res.status(400).json({ success: false, message: 'Directory is required' });
    }

    // Validate image data format
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Invalid image format' });
    }

    try {
      // Remove the data:image/[type];base64, prefix
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Create directory if it doesn't exist
      const publicDir = path.join(process.cwd(), 'public');
      const imagesDir = path.join(publicDir, 'images');
      const targetDir = path.join(imagesDir, directory);

      // Ensure directories exist
      try {
        if (!fs.existsSync(publicDir)) {
          console.log('Creating public directory');
          fs.mkdirSync(publicDir);
        }
        if (!fs.existsSync(imagesDir)) {
          console.log('Creating images directory');
          fs.mkdirSync(imagesDir);
        }
        if (!fs.existsSync(targetDir)) {
          console.log('Creating target directory:', directory);
          fs.mkdirSync(targetDir, { recursive: true });
        }
      } catch (dirError) {
        console.error('Error creating directories:', dirError);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to create required directories',
          error: dirError instanceof Error ? dirError.message : 'Unknown error'
        });
      }

      // Save the file
      const filePath = path.join(targetDir, fileName);
      try {
        fs.writeFileSync(filePath, buffer);
        console.log('File saved successfully:', filePath);
      } catch (writeError) {
        console.error('Error writing file:', writeError);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to write file',
          error: writeError instanceof Error ? writeError.message : 'Unknown error'
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Image uploaded successfully', 
        path: `/images/${directory}/${fileName}` 
      });
    } catch (processError) {
      console.error('Error processing image:', processError);
      return res.status(500).json({ 
        success: false,
        message: 'Error processing image data',
        error: processError instanceof Error ? processError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 