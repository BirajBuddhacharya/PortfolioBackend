import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RoleEnum } from '../enums/roles.enum';
import { RolesGuard } from '../guards/roles.guard';

export const ROLES_KEY = 'roles';

export const SetRoles = (...roles: RoleEnum[]) =>
  applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(RolesGuard));
