const db = require("../services/db");
const dbHelper = require("../functions/dbHelpers");
const { Comment } = require("../models/comment");
const CommentHelper = require("../functions/commentHelpers");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { jwtSecret, allowedExtensions } = require("../config");
const Jimp = require("jimp");

const upload = multer().any();

exports.createComment = async (req, res) => {
  try {
    upload(req, res, async (e) => {
      const fields = JSON.parse(req.body.fields);
      const { userName, email, homePage, replied, text } = fields;

      let preparedData = {
        userName,
        email,
        homePage,
      };
      if (
        req.headers.authorization !== undefined &&
        req.headers.authorization.startsWith("Bearer ")
      ) {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, jwtSecret);

        const { userId } = decoded;
        const response = await db.query("SELECT * FROM users WHERE id = $1", [
          userId,
        ]);
        (preparedData.userName = response[0].userName),
          (preparedData.email = response[0].email),
          (preparedData.homePage = response[0].data?.homePage);
      }

      if (e) {
        Console.error("Error while processing form: ", e);
        return res.status(500).json({
          status: false,
          payload: null,
          error: {
            message: "Error while processing form",
            description: e.message,
            code: 500,
          },
        });
      }

      if (req.files[0] && text)
        return res
          .status(400)
          .json({ error: "Only text or images are allowed simultaneously" });

      if (text) {
        if (await CommentHelper.isTextWithinLimit(text)) {
          preparedData.text = text;
        } else {
          return res.status(400).json({ error: "Text is too large" });
        }
      } else if (
        req?.files[0] &&
        allowedExtensions.includes(req.files[0].mimetype.split("/")[1])
      ) {
        const imageBuffer = req.files[0].buffer;

        try {
          const image = await Jimp.read(imageBuffer);

          if (image.bitmap.width > 240 || image.bitmap.height > 320) {
            const resizedImage = await image
              .resize(240, 320, Jimp.RESIZE_BICUBIC)
              .getBufferAsync(Jimp.MIME_PNG);
            preparedData.image = resizedImage;
          } else {
            preparedData.image = imageBuffer;
          }
        } catch (readErr) {
          return res.status(500).json({ error: readErr.message });
        }
      } else {
        return res
          .status(400)
          .json({ error: "Only JPG, PNG or GIF files allowed" });
      }

      if (typeof fields.replied === "number") {
        const repliedId = parseInt(replied);

        const existingRecord = await db.query(
          "SELECT * FROM comments WHERE id = $1",
          [repliedId]
        );

        if (existingRecord.length > 0) {
          preparedData.replied = repliedId;
        }
      }

      const { query, params } = db.createHelper(Comment, preparedData);
      if (query && params) {
        try {
          const row = await db.query(query, params);
          console.info(`Comment was added`);
          res.status(201).send({
            status: true,
            payload: row && row.length > 0 ? row[0] : {},
            error: null,
          });
        } catch (error) {
          console.error(`Error while creating comment: ${error.toString()}`);
          res.status(500).json({
            status: false,
            payload: null,
            error: {
              message: "Error while creating comment",
              description: error.toString(),
              code: 500,
            },
          });
        }
      }
    });
  } catch (e) {
    console.error(`Error in createComment: ${e.toString()}`);
    res.status(500).json({
      status: false,
      payload: null,
      error: {
        message: "Error in createComment",
        description: e.toString(),
        code: 500,
      },
    });
  }
};

exports.listAllComments = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const isHideDeleted = req.query.deleted === "true";
    const reverse = req.query.reverse === "true";

    if (isHideDeleted) {
      if (
        req.headers.authorization !== undefined &&
        req.headers.authorization.startsWith("Bearer ")
      ) {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, jwtSecret);
        if (decoded.role !== "admin")
          return res.status(403).json({
            payload: null,
            error: "Regular users cannot view deleted comments",
          });
      }
    }

    if (isHideDeleted) {
      return await dbHelper.listAllRecords(
        req,
        res,
        Comment,
        false,
        page,
        reverse
      );
    } else {
      return await dbHelper.listAllRecords(
        req,
        res,
        Comment,
        true,
        page,
        reverse
      );
    }
  } catch (e) {
    const error = `Error in listAllComments`;
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
};

exports.findCommentsSelf = async (req, res) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    return res
      .status(401)
      .json({ status: false, message: "Unauthorized: Token not found" });
  }

  const page = req.query.page || 1;
  const isHideDeleted = req.query.deleted === "true";
  const reverse = req.query.reverse === "true";
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, jwtSecret);

  const userId = decoded.userId;
  const response = await db.query("SELECT * FROM users WHERE id = $1", [
    userId,
  ]);
  if (isHideDeleted) {
    return await dbHelper.findModelByField(
      req,
      res,
      Comment,
      "email",
      response[0].email,
      false,
      page,
      reverse
    );
  } else {
    return await dbHelper.findModelByField(
      req,
      res,
      Comment,
      "email",
      response[0].email,
      true,
      page,
      reverse
    );
  }
};

exports.updateCommentById = async (req, res) => {};
