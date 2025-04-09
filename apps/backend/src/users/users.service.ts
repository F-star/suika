import { ConflictException, Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
      },
    });
  }

  findOneByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  // register(username: string, password: string) {
  //   return this.prisma.user.create({
  //     data: {
  //       username,
  //       password,
  //     },
  //   });
  // }

  async register(username: string, password: string) {
    try {
      return await this.prisma.user.create({
        data: {
          username,
          password,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        // Prisma unique constraint violation error code
        throw new ConflictException('username already exists');
      }
      throw error; // other errors continue to throw
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: updateUserDto,
    });
  }
}
