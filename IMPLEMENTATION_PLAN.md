# Portfolio Backend — Implementation Plan

> Reference repo: `/home/otakugod/d/DalloTech/KSBBL/kamana-assitance-be`
> Stack: NestJS v11, **Prisma ORM** (TypeORM patterns translated), PostgreSQL, JWT auth

---

## 1. Overview

The goal is to wire up all the shared infrastructure from the reference repo — guards, interceptors, filters, pipes, decorators, `BaseService`, `BaseEntity`/base model convention, `PaginationDto`, `ResponseDto`, and an `AuthModule` — while **replacing TypeORM with Prisma**.

---

## 2. Key Architectural Differences: TypeORM → Prisma

| TypeORM concept | Prisma equivalent |
|---|---|
| `@Entity()` class + `BaseEntity` decorators | Prisma schema `model` blocks + plain TS `BaseModel` interface |
| `Repository<T>` | Prisma delegate (`prisma.user`, `prisma.post`, etc.) |
| `@InjectRepository(Entity)` | Inject `PrismaService`, pass delegate to `BaseService` |
| `CreateBaseService(Entity)` factory | `CreateBaseService(delegate)` factory using `PrismaService` |
| `FindManyOptions<T>` | Prisma's typed `FindManyArgs` (or `any` for generic base) |
| `softDelete()` — TypeORM built-in | Manual: `update({ where, data: { deletedAt: new Date() } })` |
| `EntityNotFoundError` | `PrismaClientKnownRequestError` with code `P2025` |
| `QueryFailedError` (unique violation) | `PrismaClientKnownRequestError` with code `P2002` |
| `typeorm-transactional` | `prisma.$transaction(async (tx) => { ... })` |

---

## 3. Target Directory Structure

```
src/
├── main.ts                              # Bootstrap: Swagger, CORS, global prefix, body limit
├── app.module.ts                        # Global APP_GUARD, APP_INTERCEPTOR, APP_FILTER, APP_PIPE
├── app.controller.ts
├── app.service.ts
│
├── prisma/
│   ├── prisma.module.ts                 # Global PrismaModule (exports PrismaService)
│   └── prisma.service.ts                # PrismaService extends PrismaClient
│
├── common/
│   ├── dto/
│   │   ├── pagination.dto.ts            # PaginationDto class with constructor defaults
│   │   └── paginated-data.dto.ts        # PaginatedData<T> { result: T[], total: number }
│   ├── response/
│   │   └── response.dto.ts              # ResponseDto + ResponseType enum
│   ├── service/
│   │   └── base.service.ts              # Abstract BaseService<T> over a Prisma delegate
│   └── util/
│       └── create-base-service.ts       # CreateBaseService() factory function
│
├── interceptors/
│   ├── response.interceptor.ts          # Maps ResponseDto → { status, timestamp, message, data, duration }
│   └── logging.interceptor.ts           # Logs [METHOD /url - Xms]
│
├── filters/
│   └── all-exceptions.filter.ts         # Catches Prisma errors, HttpException, AxiosError → structured JSON
│
├── pipes/
│   └── validation.pipe.ts               # Thin wrapper around NestJS ValidationPipe
│
├── decorators/
│   ├── current-user.decorator.ts        # @CurrentUser() — extracts request.user
│   ├── pagination.decorator.ts          # @PaginationSortQuery() — parses ?pagination&page&size&sort
│   ├── public.decorator.ts              # @SkipAuthCheck() — opts route out of JWT guard
│   ├── roles.decorator.ts               # @SetRoles(...roles) — metadata + RolesGuard composite
│   ├── swagger-pagination.decorator.ts  # @RequireSwaggerPaginationSort() — Swagger query docs
│   └── req-signal.decorator.ts          # @ReqSignal() — AbortSignal tied to request lifecycle
│
├── guards/
│   ├── jwt-auth.guard.ts                # Extends AuthGuard('jwt'); skips if @SkipAuthCheck()
│   └── roles.guard.ts                   # Checks request.user.role against @SetRoles() metadata
│
├── config/
│   ├── app.config.ts                    # registerAs('app', ...) — JWT secret, expiry, port, CORS
│   └── config.type.ts                   # AllConfig type: { app: AppConfig }
│
├── enums/
│   └── roles.enum.ts                    # RoleEnum values (e.g. ADMIN, USER)
│
└── modules/
    └── auth/
        ├── auth.module.ts
        ├── auth.controller.ts
        ├── auth.service.ts              # login() → JWT; me() → current user
        ├── dto/
        │   └── login.dto.ts
        └── strategies/
            └── jwt.strategy.ts         # validate() rehydrates user from Prisma by sub/id

prisma/
└── schema.prisma                        # All Prisma models; all share base fields convention
```

---

## 4. Step-by-Step Implementation Tasks

### Step 1 — Install Dependencies

```bash
npm install @nestjs/jwt @nestjs/passport @nestjs/swagger @nestjs/config \
  passport passport-jwt \
  class-transformer class-validator \
  @prisma/client prisma \
  bcrypt

npm install -D @types/passport-jwt @types/bcrypt
```

### Step 2 — Prisma Setup

**`prisma/schema.prisma`**

All models share a base convention (Prisma doesn't have inheritance, so we repeat the fields or use a generator extension):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Base fields convention (every model includes these):
// id        Int       @id @default(autoincrement())
// createdAt DateTime  @default(now())
// updatedAt DateTime  @updatedAt
// deletedAt DateTime?

model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String
  role      RoleEnum  @default(USER)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
}

enum RoleEnum {
  ADMIN
  USER
}
```

**`src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

**`src/prisma/prisma.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Step 3 — Common DTOs

**`src/common/dto/pagination.dto.ts`**

```typescript
export class PaginationDto {
  pagination: boolean;
  sort?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  take?: number;

  constructor(
    pagination = false,
    skip = 0,
    take = 10,
    sort: Record<string, 'asc' | 'desc'> = { updatedAt: 'desc' },
  ) {
    this.pagination = pagination;
    this.skip = skip;
    this.take = take;
    this.sort = sort;
  }
}
```

**`src/common/dto/paginated-data.dto.ts`**

```typescript
export class PaginatedData<T> {
  result: T[];
  total: number;

  constructor(result: T[], total: number) {
    this.result = result;
    this.total = total;
  }
}
```

**`src/common/response/response.dto.ts`**

```typescript
export enum ResponseType {
  JSON = 'JSON',
  RAW = 'RAW',
}

export class ResponseDto {
  data?: any;
  message?: string = 'Api successful';
  responseType?: ResponseType;

  constructor(data?: any, message?: string, responseType?: ResponseType) {
    if (data !== undefined) this.data = data;
    if (data?.message || message) this.message = message ?? data?.message;
    if (responseType) this.responseType = responseType;
  }
}
```

### Step 4 — BaseService (Prisma version)

The core design: `BaseService<T>` receives a Prisma delegate at construction time. All queries automatically exclude soft-deleted records (`deletedAt: null`).

**`src/common/service/base.service.ts`**

```typescript
import { NotFoundException } from '@nestjs/common';
import { PaginationDto } from '../dto/pagination.dto';
import { PaginatedData } from '../dto/paginated-data.dto';

type PrismaDelegate = {
  findMany(args?: any): Promise<any[]>;
  findFirst(args?: any): Promise<any | null>;
  findFirstOrThrow(args?: any): Promise<any>;
  findUnique(args: any): Promise<any | null>;
  create(args: any): Promise<any>;
  createMany(args: any): Promise<any>;
  update(args: any): Promise<any>;
  updateMany(args: any): Promise<any>;
  delete(args: any): Promise<any>;
  deleteMany(args?: any): Promise<any>;
  count(args?: any): Promise<number>;
  upsert(args: any): Promise<any>;
};

export abstract class BaseService<T> {
  constructor(protected readonly model: PrismaDelegate) {}

  async find(
    where: any = {},
    paginationDto: PaginationDto = new PaginationDto(),
  ): Promise<PaginatedData<T>> {
    const baseWhere = { ...where, deletedAt: null };
    const orderBy = paginationDto.sort ?? { updatedAt: 'desc' };

    if (paginationDto.pagination) {
      const [result, total] = await Promise.all([
        this.model.findMany({
          where: baseWhere,
          orderBy,
          skip: paginationDto.skip,
          take: paginationDto.take,
        }),
        this.model.count({ where: baseWhere }),
      ]);
      return new PaginatedData<T>(result, total);
    }

    const result = await this.model.findMany({ where: baseWhere, orderBy });
    return new PaginatedData<T>(result, result.length);
  }

  findOne(where: any): Promise<T | null> {
    return this.model.findFirst({ where: { ...where, deletedAt: null } });
  }

  async findOneOrFail(where: any): Promise<T> {
    const record = await this.findOne(where);
    if (!record) throw new NotFoundException('Requested data not found');
    return record;
  }

  create(data: any): Promise<T> {
    return this.model.create({ data });
  }

  createMany(data: any[]): Promise<{ count: number }> {
    return this.model.createMany({ data });
  }

  update(where: any, data: any): Promise<T> {
    return this.model.update({ where, data });
  }

  updateMany(where: any, data: any) {
    return this.model.updateMany({ where, data });
  }

  softDelete(where: any): Promise<T> {
    return this.model.update({ where, data: { deletedAt: new Date() } });
  }

  softDeleteMany(where: any) {
    return this.model.updateMany({ where, data: { deletedAt: new Date() } });
  }

  hardDelete(where: any): Promise<T> {
    return this.model.delete({ where });
  }

  count(where: any = {}): Promise<number> {
    return this.model.count({ where: { ...where, deletedAt: null } });
  }

  exists(where: any): Promise<boolean> {
    return this.count(where).then((c) => c > 0);
  }

  upsert(where: any, create: any, update: any): Promise<T> {
    return this.model.upsert({ where, create, update });
  }
}
```

**`src/common/util/create-base-service.ts`** — Factory (mirrors TypeORM version)

```typescript
import { Injectable, Type } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseService } from '../service/base.service';

export function CreateBaseService<T>(
  delegateKey: keyof PrismaService,
): Type<BaseService<T>> {
  @Injectable()
  class GeneratedBaseService extends BaseService<T> {
    constructor(prisma: PrismaService) {
      super(prisma[delegateKey] as any);
    }
  }
  return GeneratedBaseService as Type<BaseService<T>>;
}
```

Usage in any module:
```typescript
// user/user.base.service.ts
@Injectable()
export class UserBaseService extends CreateBaseService<User>('user') {}

// user/user.module.ts
@Module({
  providers: [UserBaseService, UserService],
  exports: [UserBaseService, UserService],
})
export class UserModule {}
```

### Step 5 — Interceptors

**`src/interceptors/response.interceptor.ts`** — maps `ResponseDto` to structured envelope

```typescript
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    return next.handle().pipe(
      map((res: ResponseDto) => {
        if (res?.responseType === ResponseType.RAW) return res.data;
        const status = context.switchToHttp().getResponse().statusCode;
        return {
          status,
          timestamp: new Date().toISOString(),
          message: res?.message ?? 'Api successful',
          data: res?.data,
          duration: `${Date.now() - start}ms`,
        };
      }),
    );
  }
}
```

**`src/interceptors/logging.interceptor.ts`** — same as reference

### Step 6 — Exception Filter (Prisma errors)

**`src/filters/all-exceptions.filter.ts`**

Replace TypeORM-specific error types with Prisma's:

```typescript
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // ...
    if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025': status = 404; message = 'Record not found'; break;
        case 'P2002': status = 409; message = 'Unique constraint violation'; break;
        case 'P2003': status = 422; message = 'Foreign key constraint failed'; break;
        default:      status = 422; message = exception.message;
      }
    } else if (exception instanceof PrismaClientValidationError) {
      status = 400; message = 'Invalid query parameters';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus(); message = exception.message;
    } else if (exception instanceof AxiosError) {
      status = exception.response?.status ?? 500;
      message = exception.response?.data ?? 'External service error';
    }
    // ... log and send structured JSON
  }
}
```

### Step 7 — Pipes

**`src/pipes/validation.pipe.ts`** — thin wrapper (same as reference)

```typescript
@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  async transform(value: any, metadata: ArgumentMetadata) {
    try {
      return await super.transform(value, metadata);
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
    }
  }
}
```

### Step 8 — Decorators

| File | Decorator | What it does |
|---|---|---|
| `current-user.decorator.ts` | `@CurrentUser()` | Returns `request.user` (rehydrated from JWT validate) |
| `pagination.decorator.ts` | `@PaginationSortQuery()` | Parses `?pagination&page&size&sort` → `PaginationDto` |
| `public.decorator.ts` | `@SkipAuthCheck()` | Sets `IS_PUBLIC` metadata; JWT guard skips the route |
| `roles.decorator.ts` | `@SetRoles(...roles)` | Sets roles metadata + applies `RolesGuard` |
| `swagger-pagination.decorator.ts` | `@RequireSwaggerPaginationSort()` | Adds 4 `@ApiQuery` decorators for Swagger docs |
| `req-signal.decorator.ts` | `@ReqSignal()` | Returns `AbortSignal` that aborts when connection closes |

All decorators are direct port from reference with TypeORM references removed (e.g. `CurrentUser` returns the Prisma `User` type instead of Staff entity).

### Step 9 — Guards

**`src/guards/jwt-auth.guard.ts`**
- Extends `AuthGuard('jwt')`
- Injects `Reflector`; checks `IS_PUBLIC` metadata to skip JWT verification
- Applied globally via `APP_GUARD` in `AppModule`

**`src/guards/roles.guard.ts`**
- Reads `ROLES_KEY` metadata from reflector
- Checks `request.user.role` (string) against required roles array
- Applied per-route via `@SetRoles()` decorator (not global)

### Step 10 — Config Module

**`src/config/app.config.ts`**
```typescript
export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  jwtSecretKey: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  swaggerUser: process.env.SWAGGER_USER || 'admin',
  swaggerPassword: process.env.SWAGGER_PASSWORD || 'admin',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
}));
```

**`src/config/config.type.ts`**
```typescript
export interface AppConfig {
  port: number;
  jwtSecretKey: string;
  jwtExpiresIn: string;
  swaggerUser: string;
  swaggerPassword: string;
  corsOrigins: string[];
}
export type AllConfig = { app: AppConfig };
```

### Step 11 — Auth Module

**JWT Strategy** (`src/modules/auth/strategies/jwt.strategy.ts`)

Payload shape: `{ sub: number, email: string }` (user id + email). `validate()` fetches the full user from Prisma:

```typescript
async validate(payload: JwtPayload) {
  const user = await this.prisma.user.findFirst({
    where: { id: payload.sub, deletedAt: null },
  });
  if (!user) throw new UnauthorizedException('Authorization failed');
  return user; // becomes request.user
}
```

**Auth Service** (`src/modules/auth/auth.service.ts`)

```typescript
async login(dto: LoginDto) {
  const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
  if (!user || !(await bcrypt.compare(dto.password, user.password)))
    throw new UnauthorizedException('Invalid credentials');
  const payload = { sub: user.id, email: user.email };
  return { accessToken: this.jwtService.sign(payload), user };
}

me(user: User) {
  const { password, ...rest } = user;
  return rest;
}
```

**Auth Controller** — `POST /auth/login` (public), `GET /auth/me` (protected)

### Step 12 — AppModule Global Wiring

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    PrismaModule,
    AuthModule,
  ],
  providers: [
    AppService,
    { provide: APP_GUARD,       useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER,      useClass: AllExceptionsFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {}
```

### Step 13 — main.ts Bootstrap

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AllConfig>);

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: config.get('app', { infer: true }).corsOrigins });
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Swagger with basic auth
  const swaggerUser = config.get('app', { infer: true }).swaggerUser;
  const swaggerPass = config.get('app', { infer: true }).swaggerPassword;
  app.use('/api-docs', basicAuth({ users: { [swaggerUser]: swaggerPass }, challenge: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Portfolio API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(config.get('app', { infer: true }).port);
}
```

---

## 5. Sample Feature Module (User)

To demonstrate the pattern end-to-end:

```
src/modules/user/
├── user.module.ts
├── user.controller.ts
├── user.service.ts
├── user.base.service.ts    ← CreateBaseService<User>('user')
└── dto/
    ├── create-user.dto.ts
    └── update-user.dto.ts
```

```typescript
// user.controller.ts
@ApiTags('Users')
@Controller('users')
export class UserController {
  @Get()
  @RequireSwaggerPaginationSort()
  async findAll(@PaginationSortQuery() paginationDto: PaginationDto) {
    return new ResponseDto(await this.userService.findAll(paginationDto));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return new ResponseDto(await this.userBaseService.findOneOrFail({ id }));
  }
}
```

---

## 6. Environment Variables (`sample.env`)

```env
# App
APP_PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio_db

# Swagger
SWAGGER_USER=admin
SWAGGER_PASSWORD=admin

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:4200
```

---

## 7. Implementation Order

| # | Task | Notes |
|---|---|---|
| 1 | Install dependencies | `prisma`, `@nestjs/jwt`, `@nestjs/passport`, etc. |
| 2 | Prisma setup | `schema.prisma`, `PrismaService`, `PrismaModule` |
| 3 | Common DTOs | `PaginationDto`, `PaginatedData`, `ResponseDto` |
| 4 | BaseService | Generic service over Prisma delegate |
| 5 | CreateBaseService factory | One-liner per-entity service generation |
| 6 | Interceptors | `ResponseInterceptor`, `LoggingInterceptor` |
| 7 | Exception filter | `AllExceptionsFilter` with Prisma error codes |
| 8 | Pipe | `CustomValidationPipe` |
| 9 | Config module | `app.config.ts`, `config.type.ts` |
| 10 | Decorators | All 6 decorators |
| 11 | Guards | `JwtAuthGuard`, `RolesGuard` |
| 12 | Auth module | JWT strategy, login/me endpoints |
| 13 | AppModule wiring | Global providers, imports |
| 14 | main.ts bootstrap | Swagger, CORS, body limit, global prefix |
| 15 | Sample User module | End-to-end validation of the pattern |

---

## 8. Notes & Decisions

- **Soft delete**: All `BaseService.find/findOne` methods automatically filter `deletedAt: null`. Hard delete is available as `hardDelete()`.
- **`__entity` field**: Dropped — no equivalent in Prisma since generated types are plain interfaces, not class instances. The constructor name trick from TypeORM's `@AfterLoad` doesn't apply.
- **`toJSON()` / class-transformer**: Prisma returns plain objects. `@Exclude()` decorators don't apply. Use explicit DTO mapping or response interceptor to strip sensitive fields (e.g. `password`).
- **Transactions**: Use `prisma.$transaction(async (tx) => { ... })` instead of `typeorm-transactional`. Pass `tx` into service methods that need transactional guarantees.
- **Tree entities**: No direct Prisma equivalent for TypeORM's `TreeRepository`. Use adjacency list pattern (`parentId` field) with recursive queries or a `path` materialized column.
- **`BaseTreeService`**: Out of scope for portfolio — omit unless needed.
- **Roles**: Portfolio uses a simple `RoleEnum` on the `User` model directly (no separate `Role` entity needed, unlike the banking app's complex role/permission system).
