import sharp from "sharp"
import { readdirSync, statSync, existsSync, mkdirSync } from "fs"
import path from "path"

// 从命令行获取上传路径参数
const args = process.argv.slice(2);
const uploadPath = args[0] || "./public/uploads";

// Function to process a single directory
const processDirectory = (dirPath) => {
  // Get all files in the directory
  const files = readdirSync(dirPath)
  
  // Process each file
  for (const file of files) {
    const fullPath = path.join(dirPath, file)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory()) {
      // If it's a directory, process it recursively
      processDirectory(fullPath)
    } else if (file.toLowerCase().endsWith('.png')) {
      if (file.toLowerCase().endsWith('_thumb.png')) {
        continue
      }
      // If it's a PNG file, generate thumbnail
      const fileNameWithoutExt = path.basename(file, '.png')
      const thumbFileName = `${fileNameWithoutExt}_thumb.png`
      const thumbPath = path.join(dirPath, thumbFileName)
      
      // Generate thumbnail
      sharp(fullPath)
        .resize({
          width: 80,
          height: 80,
          fit: "inside"
        }) // Resize to 200px width (maintaining aspect ratio)
        .toFile(thumbPath)
        .then(() => console.log(`Created thumbnail: ${thumbPath}`))
        .catch(err => console.error(`Error creating thumbnail for ${fullPath}:`, err))
    }
  }
}

// Ensure upload path exists
if (!existsSync(uploadPath)) {
  console.log(`Creating directory: ${uploadPath}`)
  mkdirSync(uploadPath, { recursive: true })
}

// Start processing from the upload path
console.log(`Starting thumbnail generation from: ${uploadPath}`)
processDirectory(uploadPath)
console.log('Thumbnail generation process initiated')
