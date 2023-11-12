const defaultEnvVariablesValue = {
  appName: 'Comments API',
  environment: 'development',
  port: 5500,
  minPasswordLength: 6,
  maxUploadSize: 2097152,
  jwtSecret: 'EQUILIBRIUM',
  jwtExpiresIn: '24h',
  jwtLongExpiresIn: '720h',
  databaseURL: 'postgres://postgres:example@postgres:5432/postgres',
  allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
  maxUserFieldsLength: 30,
  maxCommentTextWeight: 102400
}

module.exports = defaultEnvVariablesValue
