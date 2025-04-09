import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { User } from '../users/decorators/user.decorator';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'create team' })
  create(@User() user: { id: number }, @Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(user.id, createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'get all teams' })
  findAllMine(
    @User() user: { id: number },
    @Query('includeProjects') includeProjects?: boolean,
  ) {
    return this.teamsService.findAllMine(includeProjects, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'get team by id' })
  findOne(
    @Param('id') id: string,
    @Query('includeProjects') includeProjects?: boolean,
  ) {
    return this.teamsService.findOne(id, includeProjects);
  }

  @Get(':id/projects')
  @ApiOperation({ summary: 'get all projects of team' })
  findTeamProjects(@Param('id') id: string) {
    return this.teamsService.findTeamProjects(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'update team' })
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'delete team' })
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}
