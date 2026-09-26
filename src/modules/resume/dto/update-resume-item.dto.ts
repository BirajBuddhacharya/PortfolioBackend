import { PartialType } from '@nestjs/swagger';
import { CreateResumeItemDto } from './create-resume-item.dto';

export class UpdateResumeItemDto extends PartialType(CreateResumeItemDto) {}
