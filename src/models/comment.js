const { dbTypes } = require("./enums/dbTypes");
const Comment = {
  _tableName: "comments",
  id: {
    type: dbTypes.KEY,
    primaryKey: true,
  },
  userName: {
    type: dbTypes.STRING,
    allowNull: false,
  },
  email: {
    type: dbTypes.STRING,
    allowNull: false,
  },
  homePage: {
    type: dbTypes.STRING,
    allowNull: true,
  },
  text: {
    type: dbTypes.STRING,
    allowNull: true,
  },
  data: {
    type: dbTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  replied: {
    type: dbTypes.INTEGER,
    allowNull: true,
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
};

module.exports.Comment = Comment;
