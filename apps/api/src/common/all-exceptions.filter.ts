import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ApiErrorPayload } from '@copilot/contracts';
import { logger } from '@copilot/observability';
import { CORRELATION_ID_HEADER } from './correlation-id.middleware.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = (request.headers[CORRELATION_ID_HEADER] as string) || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.INTERNAL_ERROR;
    let message = 'An unexpected internal error occurred';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj.message as string) || exception.message;
        code = (obj.code as ErrorCode) || this.mapStatusToErrorCode(status);
        details = (obj.details as Record<string, unknown>) || undefined;
      } else {
        message = exception.message;
        code = this.mapStatusToErrorCode(status);
      }
    } else if (exception instanceof Error) {
      logger.error(`Unhandled system exception: ${exception.message}`, exception, {
        correlationId,
        service: 'api',
      });
    }

    const payload: ApiErrorPayload = {
      code,
      message,
      correlationId,
      details,
    };

    response.status(status).json(payload);
  }

  private mapStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTH_REQUIRED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.ACCESS_DENIED;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      case HttpStatus.CONFLICT:
        return ErrorCode.JOB_ALREADY_RUNNING;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.PROVIDER_UNAVAILABLE;
      case HttpStatus.GATEWAY_TIMEOUT:
        return ErrorCode.MODEL_TIMEOUT;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
