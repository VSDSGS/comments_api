require("dotenv").config();

module.exports = {
  appName: process.env.APP_NAME,
  environment: process.env.ENVIRONMENT,
  port: process.env.PORT && Number(process.env.PORT),
  databaseURL: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  minPasswordLength:
    process.env.MINPASSWORDLENGTH && Number(process.env.MINPASSWORDLENGTH),
  jwtExpiresIn: process.env.JWTEXPIREINTERVAL,
  jwtLongExpiresIn: process.env.JWTLONGEXPIREINTERVAL,
  isLogToFile: process.env.ISLOGTOFILE && process.env.ISLOGTOFILE === "true",
  isLogToConsole:
    process.env.ISLOGTOCONSOLE && process.env.ISLOGTOCONSOLE === "true",
  redisUri: process.env.REDISURI,
  cacheTTL: process.env.CACHETTL && Number(process.env.CACHETTL),
  maxUploadSize: process.env.MAX_UPLOAD_SIZE,
  blockCron: process.env.BLOCK_CRON,
  refreshToken: process.env.GMAIL_REFRESH_TOKEN,
};
