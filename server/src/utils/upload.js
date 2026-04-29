const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const config = require('../config');

async function ensureDirs() {
  await fs.mkdir(config.storage.uploadsDir, { recursive: true });
  await fs.mkdir(config.storage.thumbnailsDir, { recursive: true });
}

function validateFileType(mimetype) {
  if (!config.storage.allowedMimeTypes.includes(mimetype)) {
    return { valid: false, error: 'Invalid file type. Only JPG, PNG, GIF, WEBP allowed' };
  }
  return { valid: true };
}

function getExtension(mimetype) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };
  return map[mimetype] || '.jpg';
}

async function generateThumbnail(inputPath, outputPath) {
  await sharp(inputPath)
    .resize(config.storage.thumbnailWidth, config.storage.thumbnailHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toFile(outputPath);
}

async function getImageDimensions(filePath) {
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
  };
}

async function saveUploadedFile(file) {
  await ensureDirs();

  const validation = validateFileType(file.mimetype);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ext = getExtension(file.mimetype);
  const uuid = uuidv4();
  const filename = uuid + ext;
  const uploadPath = path.join(config.storage.uploadsDir, filename);
  const thumbnailFilename = uuid + '_thumb' + ext;
  const thumbnailPath = path.join(config.storage.thumbnailsDir, thumbnailFilename);

  await fs.writeFile(uploadPath, file.data);

  const dimensions = await getImageDimensions(uploadPath);

  if (!file.mimetype.includes('gif')) {
    await generateThumbnail(uploadPath, thumbnailPath);
  } else {
    await fs.copyFile(uploadPath, thumbnailPath);
  }

  const stats = await fs.stat(uploadPath);

  return {
    id: uuid,
    filename,
    thumbnailFilename,
    filepath: uploadPath,
    thumbnailPath,
    fileSize: stats.size,
    width: dimensions.width,
    height: dimensions.height,
    mimeType: file.mimetype,
    extension: ext,
  };
}

function sanitizeFilename(filename) {
  return path.basename(filename).replace(/[/\\?%*:|"<>]/g, '_');
}

module.exports = {
  saveUploadedFile,
  getImageDimensions,
  validateFileType,
  sanitizeFilename,
  ensureDirs,
};
