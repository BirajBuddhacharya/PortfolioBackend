import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto, ResponseType } from '../common/response/response.dto';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = performance.now();

    return next.handle().pipe(
      map((res: ResponseDto) => {
        if (res?.responseType === ResponseType.RAW) {
          return res.data;
        }

        const status = context.switchToHttp().getResponse().statusCode;
        const durationMs = performance.now() - start;

        return {
          status,
          timestamp: new Date().toISOString(),
          message: res?.message ?? 'Api successful',
          data: res?.data,
          duration: `${durationMs.toFixed(2)}ms`,
          durationMs: Math.round(durationMs * 100) / 100,
        };
      }),
    );
  }
}
