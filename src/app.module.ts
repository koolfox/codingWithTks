import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MemoryUsageInterceptor } from './memory.interceptor';
import { PackagesController } from './packages/packages.controller';
import { PackagesService } from './packages/packages.service';

@Module({
  imports: [HttpModule],
  controllers: [PackagesController],
  providers: [
    PackagesService,
    { provide: APP_INTERCEPTOR, useClass: MemoryUsageInterceptor },
  ],
})
export class AppModule {}
