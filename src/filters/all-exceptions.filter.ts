import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';
import { Request, Response } from 'express';
import type { AxiosError } from 'axios';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let message: any = (exception as any)?.message || 'Error occurred';
    let stack = (exception as any)?.stack;
    let status = (exception as any)?.status || HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof UnauthorizedException) {
      status = exception.getStatus();
      message = exception.message;
      stack = exception.stack;
    } else if (exception instanceof BadRequestException) {
      status = exception.getStatus();
      message = (exception.getResponse() as any)?.message ?? exception.message;
      stack = exception.stack;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      stack = exception.stack;
    } else if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Unique constraint violation';
          break;
        case 'P2003':
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          message = 'Foreign key constraint failed';
          break;
        default:
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          message = exception.message;
      }
      stack = exception.stack;
    } else if (exception instanceof PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid query parameters';
      stack = exception.stack;
    } else if ((exception as any)?.isAxiosError) {
      const axiosErr = exception as AxiosError;
      status = axiosErr.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      message = axiosErr.response?.data ?? 'External service error';
      stack = axiosErr.stack;
    }

    Logger.error(message, stack, `${request.method} ${request.url}`);

    if (typeof message === 'object' && message?.message) {
      message = message.message;
    }

    response.status(status).json({
      status,
      timestamp: new Date().toISOString(),
      message,
      ...(process.env.NODE_ENV === 'development' ? { stack } : {}),
    });
  }
}
