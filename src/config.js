import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4100),
  appName: process.env.APP_NAME || 'MegaSuite',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/megasuite',
  databaseSsl: String(process.env.DATABASE_SSL || 'false') === 'true',
};
