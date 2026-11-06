import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto, ResponseType } from '../common/response/response.dto';

const SENSITIVE_KEYS = new Set(['password', 'tokenVersion']);

/**
 * Defence in depth behind the per-repository `select` allowlists: even if a
 * future endpoint returns a raw Prisma row, credentials never reach the wire.
 */
function stripSensitive(value: any): any {
  if (Array.isArray(value)) return value.map(stripSensitive);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, child] of Object.entries(value)) {
      if (!SENSITIVE_KEYS.has(key)) result[key] = stripSensitive(child);
    }
    return result;
  }
  return value;
}

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
          data: stripSensitive(res?.data),
          // Timing is useful locally but leaks latency hints in production (V5).
          ...(process.env.NODE_ENV !== 'production'
            ? {
                duration: `${durationMs.toFixed(2)}ms`,
                durationMs: Math.round(durationMs * 100) / 100,
              }
            : {}),
        };
      }),
    );
  }
}
