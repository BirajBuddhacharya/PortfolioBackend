import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkipAuthCheck } from '../../decorators/public.decorator';
import { SetRoles } from '../../decorators/roles.decorator';
import { RoleEnum } from '../../enums/roles.enum';
import { ResponseDto } from '../../common/response/response.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  @SkipAuthCheck()
  async getProfile() {
    return new ResponseDto(await this.profileService.getProfile());
  }

  @Patch()
  @SetRoles(RoleEnum.ADMIN)
  async updateProfile(@Body() dto: UpdateProfileDto) {
    return new ResponseDto(
      await this.profileService.updateProfile(dto),
      'Profile updated',
    );
  }
}
