const { AppError, createErrorResponse } = require('../utils/errors');

async function errorHandler(error, request, reply) {
  request.log.error(error);

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send(createErrorResponse(error));
  }

  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    return reply.code(401).send({
      code: 401001,
      message: 'Unauthorized: authentication required',
      data: null,
    });
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
    return reply.code(401).send({
      code: 401003,
      message: 'Unauthorized: token expired',
      data: null,
    });
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply.code(401).send({
      code: 401004,
      message: 'Unauthorized: invalid token',
      data: null,
    });
  }

  if (error.statusCode === 413) {
    return reply.code(413).send({
      code: 400007,
      message: 'Request entity too large',
      data: null,
    });
  }

  if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
    return reply.code(400).send({
      code: 400007,
      message: 'File too large',
      data: null,
    });
  }

  const statusCode = error.statusCode || 500;
  return reply.code(statusCode).send({
    code: statusCode >= 500 ? 500001 : statusCode * 1000 + 1,
    message: error.message || 'Internal server error',
    data: null,
  });
}

module.exports = errorHandler;
