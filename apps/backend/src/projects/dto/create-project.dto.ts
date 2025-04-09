import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: 'project name' })
  @IsNotEmpty({ message: 'project name cannot be empty' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'project description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'team id' })
  @IsNotEmpty({ message: 'team id cannot be empty' })
  @IsString()
  teamId: string;
}
