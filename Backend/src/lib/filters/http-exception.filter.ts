import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL';
    let message = 'Internal server error';
    let details: string[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody = exception.getResponse();

      if (typeof resBody === 'string') {
        message = resBody;
      } else if (resBody && typeof resBody === 'object') {
        const bodyObj = resBody as Record<string, unknown>;
        const bodyMsg = bodyObj.message;

        if (typeof bodyMsg === 'string') {
          message = bodyMsg;
        } else if (Array.isArray(bodyMsg)) {
          code = 'VALIDATION_ERROR';
          details = bodyMsg as string[];
          message = 'Validation failed';
        } else {
          message = exception.message;
        }
      }

      if (code === 'INTERNAL') {
        if (status === HttpStatus.BAD_REQUEST) {
          code = 'BAD_REQUEST';
        } else if (status === HttpStatus.UNAUTHORIZED) {
          code = 'UNAUTHORIZED';
        } else if (status === HttpStatus.FORBIDDEN) {
          code = 'FORBIDDEN';
        } else if (status === HttpStatus.NOT_FOUND) {
          code = 'NOT_FOUND';
        } else if (status === HttpStatus.CONFLICT) {
          code = 'CONFLICT';
        } else if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
          code = 'VALIDATION_ERROR';
        }
      }
    } else {
      console.error('Unhandled exception:', exception);
    }

    response.status(status).json({
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    });
  }
}
