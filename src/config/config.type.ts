export interface AppConfig {
  port: number;
  jwtSecretKey: string;
  jwtExpiresIn: string;
  swaggerUser: string;
  swaggerPassword: string;
  corsOrigins: string[];
  turnstileSecretKey: string;
  resendApiKey: string;
  contactEmail: string;
  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;
  frontendUrl: string;
}

export type AllConfig = {
  app: AppConfig;
};
