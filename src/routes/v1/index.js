const router = require("express")();

router.use("/", require("./upload.routes"));
router.use("/", require("./user.routes"));
router.use("/", require("./comments.routes"));

module.exports = router;
