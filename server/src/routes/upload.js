const { rateLimit } = require('../middleware/rateLimit');
const { saveUploadedFile, sanitizeFilename } = require('../utils/upload');
const { execute } = require('../utils/db');
const { invalidatePattern } = require('../utils/redis');
const config = require('../config');

async function uploadRoutes(fastify) {
  const uploadRateLimit = rateLimit({
    maxRequests: config.rateLimit.uploadLimit,
    windowMs: config.rateLimit.windowMs,
    keyGenerator: (request) => request.ip,
  });

  fastify.post('/api/upload', {
    preHandler: [uploadRateLimit],
  }, async (request, reply) => {
    try {
      const parts = {};
      let categoryId = null;
      let fileData = null;

      for await (const part of request.parts()) {
        if (part.type === 'file') {
          fileData = {
            data: await part.toBuffer(),
            mimetype: part.mimetype,
            filename: part.filename,
          };
        } else if (part.type === 'field') {
          if (part.fieldname === 'categoryId' && part.value) {
            categoryId = parseInt(part.value);
          }
        }
      }

      if (!fileData) {
        return reply.code(400).send({ code: 400, message: 'No file uploaded' });
      }

      const originalName = sanitizeFilename(fileData.filename);
      const fileInfo = await saveUploadedFile(fileData);

      await execute(
        `INSERT INTO images (id, filename, original_name, category_id, file_size, width, height, mime_type, extension) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fileInfo.id,
          fileInfo.filename,
          originalName,
          categoryId,
          fileInfo.fileSize,
          fileInfo.width,
          fileInfo.height,
          fileInfo.mimeType,
          fileInfo.extension,
        ]
      );

      await invalidatePattern('cache:*');

      return reply.code(201).send({
        code: 201,
        message: 'Upload successful',
        data: {
          id: fileInfo.id,
          filename: fileInfo.filename,
          originalName,
          thumbnailFilename: fileInfo.thumbnailFilename,
          width: fileInfo.width,
          height: fileInfo.height,
          fileSize: fileInfo.fileSize,
          mimeType: fileInfo.mimeType,
          urls: {
            direct: `${config.baseUrl}/uploads/${fileInfo.filename}`,
            thumbnail: `${config.baseUrl}/thumbnails/${fileInfo.thumbnailFilename}`,
            markdown: `![${originalName}](${config.baseUrl}/uploads/${fileInfo.filename})`,
            html: `<img src="${config.baseUrl}/uploads/${fileInfo.filename}" alt="${originalName}">`,
          },
        },
      });
    } catch (err) {
      if (err.message.includes('Invalid')) {
        return reply.code(400).send({ code: 400, message: err.message });
      }
      throw err;
    }
  });
}

module.exports = uploadRoutes;
