import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createTeamDto: CreateTeamDto) {
    return this.prisma.team.create({
      data: {
        ...createTeamDto,
        userId: userId,
      },
    });
  }

  async findAllMine(includeProjects = false, userId: number) {
    return this.prisma.team.findMany({
      where: {
        userId,
      },
      include: {
        projects: includeProjects,
      },
    });
  }

  async findOne(id: string, includeProjects = false) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        projects: includeProjects,
      },
    });

    if (!team) {
      throw new NotFoundException(`team id ${id} not found`);
    }

    return team;
  }

  async findTeamProjects(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });

    if (!team) {
      throw new NotFoundException(`team id ${id} not found`);
    }

    return team.projects;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto) {
    try {
      return await this.prisma.team.update({
        where: { id },
        data: updateTeamDto,
      });
    } catch (error) {
      throw new NotFoundException(`team id ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      // check if team exists
      const team = await this.prisma.team.findUnique({
        where: { id },
        include: { projects: true },
      });

      if (!team) {
        throw new NotFoundException(`team id ${id} not found`);
      }

      // start transaction, delete team and its related projects
      return await this.prisma.$transaction([
        // delete related projects first
        this.prisma.project.deleteMany({
          where: { teamId: id },
        }),
        // delete team
        this.prisma.team.delete({
          where: { id },
        }),
      ]);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('delete team failed');
    }
  }
}
