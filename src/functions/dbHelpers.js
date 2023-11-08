const db = require("../services/db");

function removeFieldWithBlockDirectAccess(data, model) {
  for (let fieldI in model) {
    const field = model[fieldI];
    if (field.blockDirectAccess) data[fieldI] = null;
  }
  return data;
}

function bulkRemoveFieldWithBlockDirectAccess(datas, model) {
  for (let data of datas) {
    data = removeFieldWithBlockDirectAccess(data, model);
  }
  return datas;
}

module.exports = {
  deleteModelById: async function (req, res, model, deleteSoft) {
    try {
      const id = parseInt(req.params.id);
      if (!id)
        return res.status(400).json({
          status: false,
          payload: null,
          error: {
            message: "No valid id",
            description: "No valid id",
            code: 400,
          },
        });
      let response;
      if (deleteSoft && deleteSoft === true) {
        response = await db.query(
          `UPDATE ${model._tableName} SET "deleted" = $1 WHERE id = $2 RETURNING *;`,
          [new Date(), id]
        );
      } else {
        response = await db.query(
          `DELETE FROM ${model._tableName} WHERE id = $1 RETURNING *;`,
          [id]
        );
      }
      console.info(`${model._tableName} was deleted by Admin`);
      res.status(200).send({
        status: true,
        payload:
          response && response.length > 0
            ? removeFieldWithBlockDirectAccess(response[0], model)
            : {},
        error: null,
      });
    } catch (e) {
      const error = `Error in deleteModelById for ${model._tableName}`;
      console.error(error + e.toString());
      res.status(500).json({
        status: false,
        payload: null,
        error: { message: error, description: e.toString(), code: 500 },
      });
    }
  },

  listAllRecords: async (req, res, model, isHideDeleted, page, reverse) => {
    try {
      const limit = 25;
      const offset = (page - 1) * limit;

      let response, count;
      let orderBy = "created";
      let sortOrder = "DESC";

      if (reverse !== undefined) {
        sortOrder = reverse ? "ASC" : "DESC";
      }

      if (isHideDeleted) {
        const responseQuery = await db.query(
          `SELECT * FROM ${model._tableName} WHERE deleted IS NULL ORDER BY ${orderBy} ${sortOrder} LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        response = responseQuery ? responseQuery : [];

        const countResponse = await db.query(
          `SELECT COUNT(*) FROM ${model._tableName} WHERE deleted IS NULL`
        );
        count =
          countResponse && countResponse.length > 0
            ? countResponse[0].count
            : 0;
      } else {
        const responseQuery = await db.query(
          `SELECT * FROM ${model._tableName} WHERE deleted IS NOT NULL ORDER BY ${orderBy} ${sortOrder} LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        response = responseQuery ? responseQuery : [];

        const countResponse = await db.query(
          `SELECT COUNT(*) FROM ${model._tableName} WHERE deleted IS NOT NULL`
        );
        count =
          countResponse && countResponse.length > 0
            ? countResponse[0].count
            : 0;
      }

      res.json({
        status: true,
        payload: response,
        count,
        page,
        error: null,
      });
    } catch (e) {
      const error = `Error in listAllModels for ${model._tableName}`;
      console.error(error + e.toString());
      res.status(500).json({
        status: false,
        payload: null,
        error: { message: error, description: e.toString(), code: 500 },
      });
    }
  },

  findModelByField: async function (
    req,
    res,
    model,
    fieldName,
    fieldValue,
    isHideDeleted,
    page,
    reverse
  ) {
    try {
      const limit = 25;
      const offset = (page - 1) * limit;

      let response, count;
      let orderBy = "created";
      let sortOrder = "DESC";

      if (reverse !== undefined) {
        sortOrder = reverse ? "ASC" : "DESC";
      }

      console.log(fieldValue);
      if (isHideDeleted) {
        const responseQuery = await db.query(
          `SELECT * FROM ${model._tableName} WHERE deleted IS NULL AND ${fieldName} = $1 ORDER BY ${orderBy} ${sortOrder} LIMIT $2 OFFSET $3`,
          [fieldValue, limit, offset]
        );

        response = responseQuery ? responseQuery : [];

        const countResponse = await db.query(
          `SELECT COUNT(*) FROM ${model._tableName} WHERE deleted IS NULL AND ${fieldName} = $1`,
          [fieldValue]
        );
        count =
          countResponse && countResponse.length > 0
            ? countResponse[0].count
            : 0;
      } else {
        const responseQuery = await db.query(
          `SELECT * FROM ${model._tableName} WHERE deleted IS NOT NULL AND ${fieldName} = $1 ORDER BY ${orderBy} ${sortOrder} LIMIT $2 OFFSET $3`,
          [fieldValue, limit, offset]
        );
        response = responseQuery ? responseQuery : [];

        const countResponse = await db.query(
          `SELECT COUNT(*) FROM ${model._tableName} WHERE deleted IS NOT NULL AND ${fieldName} = $1`,
          [fieldValue]
        );
        count =
          countResponse && countResponse.length > 0
            ? countResponse[0].count
            : 0;
      }

      res.json({
        status: true,
        payload: response,
        count,
        page,
        error: null,
      });
    } catch (e) {
      const error = `Error in findModelByField for ${model._tableName} where ${fieldName} = ${fieldValue}`;
      console.error(error + e.toString());
      res.status(500).json({
        status: false,
        payload: null,
        error: { message: error, description: e.toString(), code: 500 },
      });
    }
  },
};

module.exports.bulkRemoveFieldWithBlockDirectAccess =
  bulkRemoveFieldWithBlockDirectAccess;
module.exports.removeFieldWithBlockDirectAccess =
  removeFieldWithBlockDirectAccess;
