const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

function authenticate(fastify) {
  return async function (request, reply) {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        throw new UnauthorizedError(401001, 'Unauthorized: no token provided');
      }

      const decoded = fastify.jwt.verify(token);
      request.user = decoded;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError(401003, 'Unauthorized: token expired');
      }
      throw new UnauthorizedError(401004, 'Unauthorized: invalid token');
    }
  };
}

function requireRole(...roles) {
  return async function (request, reply) {
    if (!request.user) {
      throw new UnauthorizedError(401001, 'Unauthorized: authentication required');
    }

    if (!roles.includes(request.user.role)) {
      throw new ForbiddenError(403001, `Forbidden: required role(s): ${roles.join(', ')}`);
    }
  };
}

function requireAdmin() {
  return requireRole('super_admin', 'admin');
}

function requireSuperAdmin() {
  return requireRole('super_admin');
}

module.exports = {
  authenticate,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
};
