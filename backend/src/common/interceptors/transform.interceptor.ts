import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

export interface StandardResponse<T> {
  statusCode: number;
  errorCode: string | null;
  messages: string[];
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map(data => {
        const responseMessage = this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler());
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        
        return {
          statusCode: response.statusCode,
          errorCode: null,
          messages: responseMessage ? [responseMessage] : [],
          data: data,
        };
      }),
    );
  }
}
