import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let messages = ['Ha ocurrido un error inesperado al procesar la solicitud'];
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      const res = exception.getResponse() as any;
      if (typeof res === 'object' && res.message) {
        messages = Array.isArray(res.message) ? res.message : [res.message];
      } else if (typeof res === 'string') {
        messages = [res];
      }
      errorCode = res.error || res.error_code || exception.name;
    } else if (exception instanceof Error) {
        messages = [exception.message];
    }

    response.status(status).json({
      statusCode: status,
      errorCode: errorCode,
      messages: messages,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
