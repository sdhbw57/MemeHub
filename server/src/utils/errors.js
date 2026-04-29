class AppError extends Error {
  constructor(code, message, statusCode = 500, data = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(code, message, data = null) {
    super(code, message, 400, data);
  }
}

class UnauthorizedError extends AppError {
  constructor(code = 401001, message = 'Unauthorized: authentication required', data = null) {
    super(code, message, 401, data);
  }
}

class ForbiddenError extends AppError {
  constructor(code = 403001, message = 'Forbidden: insufficient permissions', data = null) {
    super(code, message, 403, data);
  }
}

class NotFoundError extends AppError {
  constructor(code = 404001, message = 'Not found', data = null) {
    super(code, message, 404, data);
  }
}

class ConflictError extends AppError {
  constructor(code = 409001, message = 'Conflict: resource already exists', data = null) {
    super(code, message, 409, data);
  }
}

class ValidationError extends AppError {
  constructor(code = 422001, message = 'Validation failed', data = null) {
    super(code, message, 422, data);
  }
}

class TooManyRequestsError extends AppError {
  constructor(code = 429001, message = 'Too many requests', data = null) {
    super(code, message, 429, data);
  }
}

class InternalError extends AppError {
  constructor(code = 500001, message = 'Internal server error', data = null) {
    super(code, message, 500, data);
  }
}

const ERROR_CODES = {
  // 400 Bad Request
  400001: 'Missing required fields',
  400002: 'Invalid field length',
  400003: 'Invalid field format',
  400004: 'No fields to update',
  400005: 'Invalid array format',
  400006: 'Invalid file type',
  400007: 'File too large',
  400008: 'No files uploaded',
  400009: 'Invalid ID format',
  400010: 'Invalid pagination parameters',
  400011: 'Invalid sort field',

  // 401 Unauthorized
  401001: 'Authentication required',
  401002: 'Invalid credentials',
  401003: 'Token expired',
  401004: 'Invalid token',

  // 403 Forbidden
  403001: 'Insufficient permissions',
  403002: 'Cannot delete yourself',
  403003: 'Admin access required',

  // 404 Not Found
  404001: 'Resource not found',
  404002: 'Category not found',
  404003: 'Image not found',
  404004: 'User not found',

  // 409 Conflict
  409001: 'Resource already exists',
  409002: 'Category contains images',
  409003: 'Batch delete blocked by images',

  // 422 Unprocessable Entity
  422001: 'Validation failed',
  422002: 'Invalid JSON format',

  // 429 Too Many Requests
  429001: 'Rate limit exceeded',

  // 500 Internal Server Error
  500001: 'Internal server error',
  500002: 'Database error',
  500003: 'File system error',
  500004: 'Cache error',
};

function getErrorMessage(code) {
  return ERROR_CODES[code] || 'Unknown error';
}

function createErrorResponse(error) {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      data: error.data,
    };
  }

  return {
    code: 500001,
    message: error.message || 'Internal server error',
    data: null,
  };
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalError,
  ERROR_CODES,
  getErrorMessage,
  createErrorResponse,
};
