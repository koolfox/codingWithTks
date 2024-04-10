import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PackagesController } from './packages/packages.controller';
import { PackagesService } from './packages/packages.service';

@Module({
  imports: [HttpModule],
  controllers: [PackagesController],
  providers: [PackagesService],
})
export class AppModule {}
