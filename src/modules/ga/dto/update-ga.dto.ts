import { PartialType } from '@nestjs/swagger';
import { CreateGaDto } from './create-ga.dto';

export class UpdateGaDto extends PartialType(CreateGaDto) {}
