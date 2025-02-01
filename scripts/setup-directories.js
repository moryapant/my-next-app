const fs = require('fs');
const path = require('path');

// Define the directories we need
const dirs = [
  'public',
  'public/images',
  'public/images/subfapps'
];

// Create directories if they don't exist
dirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(fullPath, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
}); 