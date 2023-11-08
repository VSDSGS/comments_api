const router = require("express")();
const { check } = require("express-validator");
const commentsController = require("../../controllers/comments.controller");
const validator = require("../../middleware/validate.middleware");

router.post("/comments", validator, commentsController.createComment);
router.get("/comments", commentsController.listAllComments);
router.get("/comments/me", commentsController.findCommentsSelf);
router.put("/comments/:id", commentsController.updateCommentById);

module.exports = router;
