import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { PaginatedResult } from '../dto/paginated-result.interface';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

function isPaginatedResult<T>(value: unknown): value is PaginatedResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value
  );
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<Response>();
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Requisição processada com sucesso';

    return next.handle().pipe(
      map((payload) => {
        const base = {
          success: true as const,
          statusCode: response.statusCode,
          message,
        };

        if (isPaginatedResult(payload)) {
          return {
            ...base,
            data: payload.data as T,
            meta: payload.meta,
          };
        }

        return { ...base, data: payload };
      }),
    );
  }
}
