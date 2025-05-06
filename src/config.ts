import { config } from 'dotenv';
//加载.evn文件的环境变量

config({ path: ".env.local" });

//web server 端口
export const WEB_SERVER_PORT = process.env.WEB_SERVER_PORT;

//turnkey api key
export const TURNKEY_API_PUBLIC_KEY = process.env.TURNKEY_API_PUBLIC_KEY;
export const TURNKEY_API_PRIVATE_KEY = process.env.TURNKEY_API_PRIVATE_KEY;
export const TURNKEY_BASE_URL = process.env.TURNKEY_BASE_URL;
export const TURNKEY_ORGANIZATION_ID = process.env.TURNKEY_ORGANIZATION_ID;

//redis
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = process.env.REDIS_PORT;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_DB = process.env.REDIS_DB;

