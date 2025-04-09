import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FileEntity } from './entities/file.entity';
import { User } from '../users/decorators/user.decorator';
import { UpdateFileDto } from './dto/update-file.dto';

@Controller('files')
@ApiTags('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('create')
  @ApiCreatedResponse({ type: FileEntity })
  create(
    @Body() createFileDto: Omit<CreateFileDto, 'content'>,
    @User() user: { id: number },
  ) {
    return this.filesService.create(createFileDto, user.id);
  }

  @Get()
  @ApiOkResponse({ type: FileEntity, isArray: true })
  findAll(@User() user: { id: number }) {
    return this.filesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOkResponse({ type: FileEntity })
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: FileEntity })
  updateMeta(
    @User() user: { id: number },
    @Param('id') id: string,
    @Body('data') updateFileDto: UpdateFileDto,
  ) {
    return this.filesService.update({
      id: +id,
      authorId: user.id,
      updateFileDto,
    });
  }

  @Delete()
  @ApiOkResponse({ type: FileEntity })
  remove(@Query('ids') ids: string[], @User() user: { id: number }) {
    return this.filesService.remove(
      ids.map((id) => Number(id)),
      user.id,
    );
  }
}
