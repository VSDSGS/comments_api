const { validationResult } = require("express-validator");

module.exports = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = "Some data fields are missed ";
      console.log(error + JSON.stringify(errors.array()));
      return res.status(400).json({
        status: false,
        payload: null,
        error: { message: error, description: errors.array(), code: 400 },
      });
    }
    next();
  } catch (e) {
    const error = "Unexpected error in validator";
    console.log(error + e.toString());
    return res.status(400).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 400 },
    });
  }
};
