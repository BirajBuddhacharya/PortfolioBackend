import { Prisma } from './entity/user.entity';

/**
 * The only columns the API may ever return for a user. Keeping this in one
 * place (rather than relying on each controller to strip `password`) means a
 * new endpoint cannot accidentally serialise the bcrypt hash.
 */
export const USER_SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Safe columns plus the field needed internally to validate/issue JWTs. */
export const USER_AUTH_SELECT = {
  ...USER_SAFE_SELECT,
  tokenVersion: true,
} as const;

export type SafeUser = Prisma.UserGetPayload<{
  select: typeof USER_SAFE_SELECT;
}>;

export type AuthUser = Prisma.UserGetPayload<{
  select: typeof USER_AUTH_SELECT;
}>;
