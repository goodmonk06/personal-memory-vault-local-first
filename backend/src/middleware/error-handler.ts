import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../lib/errors';
import { logger } from '../lib/logger';
import { metrics } from '../lib/metrics';

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
    requestId?: string;
  };
}

export async function errorHandler(
  error: Error | FastifyError | AppError | ZodError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const requestId = request.id;

  // Log the error
  logger.error('Request error', error, {
    requestId,
    method: request.method,
    url: request.url,
  });

  // Record error metric
  metrics.recordCounter('http_errors_total', 1, {
    method: request.method,
    path: request.routerPath || request.url,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError: ErrorResponse = {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
        requestId,
      },
    };
    return reply.code(400).send(validationError);
  }

  // Handle custom AppError instances
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        requestId,
      },
    };
    return reply.code(error.statusCode).send(response);
  }

  // Handle Fastify errors
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    const response: ErrorResponse = {
      error: {
        message: error.message,
        code: 'code' in error ? String(error.code) : undefined,
        statusCode: error.statusCode,
        requestId,
      },
    };
    return reply.code(error.statusCode).send(response);
  }

  // Default to 500 Internal Server Error
  const response: ErrorResponse = {
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      requestId,
    },
  };

  // In development, include the actual error message
  if (process.env.NODE_ENV === 'development') {
    response.error.message = error.message;
    response.error.details = { stack: error.stack };
  }

  return reply.code(500).send(response);
}
