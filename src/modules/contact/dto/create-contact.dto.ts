import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsCleanEmail, IsCleanText } from '../common/validators/clean-text.decorator';

export class CreateContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsCleanText()
  @MaxLength(120)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsCleanText()
  subject: string;

  @ApiProperty()
  @IsEmail()
  @IsCleanEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsCleanText()
  @MaxLength(5000)
  message: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  turnstileToken: string;
}
