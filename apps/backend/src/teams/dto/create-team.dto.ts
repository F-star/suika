import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ description: 'team name' })
  @IsNotEmpty({ message: 'team name cannot be empty' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'team description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'team members', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  members?: string[];
}
