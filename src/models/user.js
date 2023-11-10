const { dbTypes } = require("./enums/dbTypes");
const User = {
  _tableName: "users",
  id: {
    type: dbTypes.KEY,
    primaryKey: true,
  },
  type: {
    type: dbTypes.STRING,
    allowNull: false,
  },
  login: {
    type: dbTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "Login name",
  },
  email: {
    type: dbTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "User email",
  },
  password: {
    type: dbTypes.STRING,
    allowNull: false,
    blockDirectAccess: true,
    comment: "Hashed password",
  },
  userName: {
    type: dbTypes.STRING,
    allowNull: false,
  },
  image: {
    type: dbTypes.IMAGE,
    allowNull: true,
  },
  created: {
    type: dbTypes.TIMESTAMP,
  },
  updated: {
    type: dbTypes.TIMESTAMP,
  },
  deleted: {
    type: dbTypes.TIMESTAMP,
    allowNull: true,
  },
  lastLogin: {
    type: dbTypes.TIMESTAMP,
    allowNull: true,
  },
};

module.exports.User = User;
