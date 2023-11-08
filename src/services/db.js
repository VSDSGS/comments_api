const { Pool } = require("pg");
const { databaseURL, cacheTTL } = require("../config");
const pool = new Pool({ connectionString: databaseURL });
const bcrypt = require("bcryptjs");
// const redis = require("./redis");
const { User } = require("../models/user");
const { environment } = require("../config/env");
const { dbTypes } = require("../models/enums/dbTypes");

pool.on("error", (err) => {
  console.log("Unexpected error on idle client " + err.toString());
  process.exit(-1);
});

module.exports = {
  query: async (text, params) => {
    try {
      console.log(
        `Have a db.query text: ${text}, params: ${JSON.stringify(params)}`
      );

      if (!text || text.length === 0) {
        console.error(`An empty query was ignored`);
        return [];
      }

      const result = await pool.query(text, params);

      console.log(`SQL execution for the query text: ${text}`);
      return result.rows;
    } catch (e) {
      console.error(`Error in db.query: ${e}`);
      return [];
    }
  },

  createTable: async (model) => {
    try {
      if (model._tableName === "users") {
        const checkUser = await pool.query(
          "SELECT * FROM users WHERE login = $1",
          ["admin"]
        );
        if (checkUser.rows.length === 0) {
          const hashedPass = await bcrypt.hash("1NzAwNzQzNyw", 12);
          await pool.query(
            `INSERT INTO users ("type", "login", "email", "password", "active", "userName", "created", "updated", "deleted") VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9)  ON CONFLICT (login) DO NOTHING;`,
            [
              "admin",
              "admin",
              "admin@gmail.com",
              hashedPass,
              true,
              "Admin",
              new Date(),
              new Date(),
              null,
            ]
          );
          console.log(`Admin is granted!`);
        }
      }

      let query = `CREATE TABLE IF NOT EXISTS ${model._tableName} ( `;
      for (let field in model) {
        if (field.slice(0, 1) !== "_") {
          query += `"${field}" ${model[field].type}${
            model[field].unique ? " UNIQUE" : ""
          }${model[field].primaryKey ? " PRIMARY KEY" : ""}, `;
        }
      }
      query = query.slice(0, -2);
      query += ");";
      await pool.query(query);
      console.log(`Table ${model._tableName} is successfully created!!`);
    } catch (e) {
      if (!e.toString().includes("already exists")) {
        console.log(
          `Unexpected error on creating table ${model._tableName}`,
          e
        );
      }
    }
  },

  createHelper: (model, body) => {
    try {
      const columns = Object.keys(model).filter(
        (field) =>
          !field.startsWith("_") &&
          !model[field].primaryKey &&
          (body[field] !== undefined ||
            field === "active" ||
            field === "data" ||
            field === "created" ||
            field === "updated" ||
            field === "deleted" ||
            field === "lastLogin")
      );
      const params = [];
      const placeholders = [];

      columns.forEach((column, index) => {
        if (column === "active") {
          placeholders.push(`$${index + 1}`);
          params.push(true);
        } else if (column === "data") {
          placeholders.push(`$${index + 1}`);
          params.push(body[column]);
        } else if (column === "created" || column === "updated") {
          placeholders.push(`TO_TIMESTAMP($${params.length + 1})`);
          params.push(Date.now() / 1000);
        } else if (column === "deleted" || column === "lastLogin") {
          placeholders.push(`$${index + 1}`);
          params.push(null);
        } else {
          placeholders.push(`$${index + 1}`);
          params.push(body[column]);
        }
      });

      const columnsStr = columns.map((column) => `"${column}"`).join(", ");
      const placeholdersStr = placeholders.join(", ");

      const query = `INSERT INTO ${model._tableName} (${columnsStr}) VALUES (${placeholdersStr}) RETURNING *;`;

      return { query, params };
    } catch (e) {
      console.error("Error at createHelper: " + e.toString());
      return {};
    }
  },

  patchHelper: (model, id, body) => {
    let query = `UPDATE ${model._tableName} SET `;
    const params = [];
    for (let field in body) {
      if (
        model[field] &&
        !model[field].primaryKey &&
        !model[field].blockDirectAccess &&
        field !== "created" &&
        field !== "deleted"
      ) {
        params.push(body[field]);
        query += `"${field}" = $${params.length}, `;
      }
    }
    params.push(new Date());
    query += `updated = $${params.length}, `;
    if (params.length > 0) {
      query =
        query.slice(0, -2) + ` WHERE id = $${params.length + 1}  RETURNING *;`;
      params.push(id);
      return { query, params };
    } else {
      return {};
    }
  },

  updateHelper: (model, id, body) => {
    let query = `UPDATE ${model._tableName} SET `;
    const params = [];

    for (let field in model) {
      let value;
      if (
        field.slice(0, 1) !== "_" &&
        !model[field].primaryKey &&
        !model[field].blockDirectAccess &&
        field !== "created" &&
        field !== "deleted"
      ) {
        if (body[field] !== undefined) {
          value = body[field];
        } else if (model[field].defaultValue !== undefined) {
          value = model[field].defaultValue;
        } else if (model[field].allowNull) {
          value = null;
        } else if (field === "updated") {
          value = new Date();
        } else {
          throw new Error(`Field '${field}' is required for update`);
        }

        params.push(value);
        query += `"${field}" = $${params.length}, `;
      }
    }

    if (params.length > 0) {
      query =
        query.slice(0, -2) + ` WHERE id = $${params.length + 1} RETURNING *;`;
      params.push(id);
      return { query, params };
    } else {
      throw new Error("No fields to update");
    }
  },
};
