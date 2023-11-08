const router = require("express")();
const validator = require("../../middleware/validate.middleware");
const userController = require("../../controllers/user.controller");
const { check } = require("express-validator");
const { minPasswordLength } = require("../../config");

router.post(
  "/auth/register",
  [
    check("type", "Type is required").isString(),
    check("login", "Incorrect login name").isString(),
    check("email", "Incorrect email").isString(),
    check(
      "password",
      "Password length is less then " + minPasswordLength
    ).isLength({ min: minPasswordLength }),
    check("userName", "Incorrect user name").isString(),
  ],
  validator,
  async (req, res) => {
    try {
      return await userController.createUser(req, res);
    } catch (e) {
      const error = "Error when user register ";
      console.error(error + e.toString());
      res.status(500).json({
        status: false,
        payload: null,
        error: { message: error, description: e.toString(), code: 500 },
      });
    }
  }
);

router.post(
  "/auth/login",
  [
    check("email", "Needs a correct email").isString(),
    check("password", "Enter a password").exists(),
  ],
  validator,
  async (req, res) => {
    try {
      return await userController.login(req, res);
    } catch (e) {
      const error = `Error when user with login ${req.body.login} login`;
      console.error(error + e.toString());
      res.status(500).json({
        status: false,
        payload: null,
        error: { message: error, description: e.toString(), code: 500 },
      });
    }
  }
);

router.get("/users", userController.listAllUsers);

router.get("/users/me", userController.findUserSelf);

router.get("/users/:id", userController.findUserById);

router.put(
  "/users/:id",
  [
    check("type", "Type is required").isString(),
    check("login", "Incorrect login name").isString(),
    check("email", "Incorrect email").isString(),
    check(
      "password",
      "Password length is less then " + minPasswordLength
    ).isLength({ min: minPasswordLength }),
    check("userName", "Incorrect user name").isString(),
  ],
  validator,
  userController.updateUserById
);

router.patch("/users/me", userController.patchUserSelf);

router.delete("/users/:id", userController.deleteUserById);

module.exports = router;
