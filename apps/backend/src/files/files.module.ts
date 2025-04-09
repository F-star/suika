import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [PrismaModule],
  exports: [FilesService],
})
export class FilesModule {}
