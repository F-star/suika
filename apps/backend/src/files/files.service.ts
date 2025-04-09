import { Injectable } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateInitialDoc } from 'src/utils';

// @Injectable({ scope: Scope.REQUEST })
@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createFileDto: CreateFileDto, userId: number) {
    return this.prisma.file.create({
      data: {
        ...createFileDto,
        authorId: userId,
        body: createFileDto.body ?? '',
        content: generateInitialDoc(),
      },
    });
  }

  findAll(userId: number) {
    return this.prisma.file.findMany({
      where: { authorId: userId },
      omit: {
        authorId: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.file.findUnique({
      where: {
        id,
      },
    });
  }

  async checkExit(fileId: number, authorId: number) {
    return this.prisma.file.findUnique({
      select: {
        id: true,
      },
      where: {
        id: fileId,
        authorId,
      },
    });
  }

  async getContent(id: number) {
    return this.prisma.file.findUnique({
      select: {
        content: true,
      },
      where: {
        id,
      },
    });
  }

  update(params: {
    id: number;
    authorId: number;
    updateFileDto: UpdateFileDto;
  }) {
    return this.prisma.file.update({
      where: { id: params.id },
      data: params.updateFileDto,
    });
  }

  updateContent(id: number, content: Buffer) {
    return this.prisma.file.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date(),
      },
    });
  }

  async remove(ids: number[], userId: number) {
    await this.prisma.file.deleteMany({
      where: {
        id: {
          in: ids,
        },
        authorId: userId,
      },
    });
    return 'success deleted';
  }
}
