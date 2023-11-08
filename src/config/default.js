const defaultEnvVariablesValue = {
  appName: "Comments API",
  environment: "development",
  port: 5001,
  minPasswordLength: 6,
  maxUploadSize: 2097152,
  jwtSecret: "EQUILIBRIUM",
  jwtExpiresIn: "24h",
  jwtLongExpiresIn: "720h",
  databaseURL: "postgres://postgres:example@postgres:5432/postgres",
  allowedExtensions: ["jpg", "jpeg", "png", "gif"],
};

module.exports = defaultEnvVariablesValue;
