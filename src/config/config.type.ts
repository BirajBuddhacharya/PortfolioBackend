export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecretKey: string;
  jwtExpiresIn: string;
  swaggerUser: string;
  swaggerPassword: string;
  corsOrigins: string[];
  turnstileSecretKey: string;
  ignoreTurnstile: boolean;
  resendApiKey: string;
  contactEmail: string;
}

export type AllConfig = {
  app: AppConfig;
};
