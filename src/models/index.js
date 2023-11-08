const { createTable } = require("../services/db");
const { User } = require("./user");
const { Comment } = require("./comment");

module.exports.createTables = async function () {
  await createTable(User);
  await createTable(Comment);
};
