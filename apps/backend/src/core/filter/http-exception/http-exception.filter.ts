import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.getStatus();

    const data = exception.response;

    response.status(status);
    response.header('Content-Type', 'application/json; charset=utf-8');
    response.send({
      code: -1,
      error: true,
      message: data.message,
      data: data.data,
    });
  }
}
