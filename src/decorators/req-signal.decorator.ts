import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';

export const ReqSignal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AbortSignal => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const res = ctx.switchToHttp().getResponse<Response>();
    const controller = new AbortController();

    const abort = () => {
      if (!controller.signal.aborted) controller.abort();
    };

    res.on('close', abort);
    req.on('close', abort);

    return controller.signal;
  },
);
