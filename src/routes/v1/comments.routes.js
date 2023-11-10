const router = require("express")();
const { check } = require("express-validator");
const commentsController = require("../../controllers/comments.controller");
const validator = require("../../middleware/validate.middleware");

router.post("/comments", validator, async (req, res) => {
  try {
    return await commentsController.createComment(req, res);
  } catch (e) {
    const error = "Error when creating comment ";
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
});

router.get("/comments", async (req, res) => {
  try {
    return await commentsController.listAllComments(req, res);
  } catch (e) {
    const error = "Error when getting asll comments ";
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
});

router.get("/comments/me", async (req, res) => {
  try {
    return await commentsController.findCommentsSelf(req, res);
  } catch (e) {
    const error = "Error when getting asll comments ";
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
});

router.put("/comments/:id", async (req, res) => {
  try {
    return await commentsController.updateCommentById(req, res);
  } catch (e) {
    const error = "Error when updating comment by id ";
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
});

router.patch("/comments/:id", async (req, res) => {
  try {
    return await commentsController.patchCommentById(req, res);
  } catch (e) {
    const error = "Error when patching comment by id ";
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
});

router.delete("/comments/:id", async (req, res) => {
  try {
    return await commentsController.deleteCommentById(req, res);
  } catch (e) {
    const error = "Error when patching comment by id ";
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
});

module.exports = router;
