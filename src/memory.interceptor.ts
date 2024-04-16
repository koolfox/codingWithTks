import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class MemoryUsageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const memoryBefore = process.memoryUsage();

    return next.handle().pipe(
      tap(() => {
        const memoryAfter = process.memoryUsage();
        const time = Date.now() - now;
        console.log(
          `Memory usage before: ${this.formatMemoryUsage(memoryBefore)}`,
        );
        console.log(
          `Memory usage after: ${this.formatMemoryUsage(memoryAfter)}`,
        );
        console.log(`Request processing time: ${time}ms`);
      }),
    );
  }

  private formatMemoryUsage(memoryUsage: NodeJS.MemoryUsage): string {
    return `RSS: ${memoryUsage.rss / (1024 * 1024)}, Heap Total: ${memoryUsage.heapTotal / (1024 * 1024)}, Heap Used: ${memoryUsage.heapUsed / (1024 * 1024)}`;
  }
}
