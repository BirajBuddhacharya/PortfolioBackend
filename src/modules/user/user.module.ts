import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserBaseService } from './user.base.service';

@Module({
  controllers: [UserController],
  providers: [UserBaseService, UserService],
  exports: [UserBaseService, UserService],
})
export class UserModule {}
