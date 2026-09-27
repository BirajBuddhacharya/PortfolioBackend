export interface AppConfig {
  port: number;
  jwtSecretKey: string;
  jwtExpiresIn: string;
  swaggerUser: string;
  swaggerPassword: string;
  corsOrigins: string[];
  turnstileSecretKey: string;
}

export type AllConfig = {
  app: AppConfig;
};
