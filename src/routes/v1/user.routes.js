const router = require("express")();
const validator = require("../../middleware/validate.middleware");
const userController = require("../../controllers/user.controller");
const { check } = require("express-validator");
const { minPasswordLength } = require("../../config");

/**
 * @api {post} /v1/auth/register Create User
 * @apiVersion 1.0.0
 * @apiName CreateUser
 * @apiGroup User
 *
 * @apiBody {String} type Type of user (only admin of user) Only admin user can create admin user
 * @apiBody {String} login User login
 * @apiBody {String} password User password (min: 6)
 * @apiBody {String} email User email
 * @apiBody {String} userName User name
 * @apiBody {Base64} image data (only jpg, jpeg, png, gif)
 *
 * @apiSuccess {json} object object with payload
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
        "id", "type", "login", "email", "password", "userName", "image", "created", "updated", "deleted", "lastLogin"
    }
 *
 * @apiError {json} object object with error
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *      status: false,
 *      payload: null,
 *      error: {
 *        message: error,
 *        description: error,
 *        code: 400 },
 *     }
 */
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

/**
 * @api {post} /v1/auth/login User login
 * @apiVersion 1.0.0
 * @apiName Login
 * @apiGroup User
 *
 * @apiBody {String} email User email
 * @apiBody {String} password User password
 *
 * @apiSuccess {json} object object with payload
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      status: true,
 *      payload: { token,userId },
 *      error: null,
 * }
 *
 * @apiError {json} object object with error
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *      status: false,
 *      payload: null,
 *      error: {
 *        message: error,
 *        description: error,
 *        code: 400 },
 *     }
 */
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

/**
 * @api {get} /v1/users Get all users (Only admin)
 * @apiVersion 1.0.0
 * @apiName ListAllUsers
 * @apiGroup User
 * @apiParam {number} Page Page number
 * @apiParam {boolean} Reverse Reverse array
 * @apiParam {boolean} Deleted True or False
 *
 *
 * @apiSuccess {json} object object with payload
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      status: true,
 *      payload: { response },
 *      error: null,
 *     }
 * @apiError {json} object object with error
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *      status: false,
 *      payload: null,
 *      error: {
 *        message: error,
 *        description: error,
 *        code: 400 },
 *     }
 */
router.get("/users", async (req, res) => {
  try {
    return await userController.listAllUsers(req, res);
  } catch (e) {
    const error = "Error when get all users ";
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
});

/**
 * @api {get} /v1/users/me Get user self info
 * @apiVersion 1.0.0
 * @apiName FindUserSelf
 * @apiGroup User
 *
 * @apiSuccess {json} object object with payload
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      status: true,
 *      payload: { response },
 *      error: null,
 * }
 * @apiError {json} object object with error
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *      status: false,
 *      payload: null,
 *      error: {
 *        message: error,
 *        description: error,
 *        code: 400 },
 *     }
 */
router.get("/users/me", async (req, res) => {
  try {
    return await userController.findUserSelf(req, res);
  } catch (e) {
    const error = "Error when getting self info ";
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
});

/**
 * @api {get} /v1/users/:id Get user by id (Only for admin)
 * @apiVersion 1.0.0
 * @apiName GetUserById
 * @apiGroup User
 *
 * @apiParam {Number} id User id
 *
 * @apiSuccess {json} object object with payload
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      status: true,
 *      payload: { response },
 *      error: null,
 * }
 * @apiError {json} object object with error
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *      status: false,
 *      payload: null,
 *      error: {
 *        message: error,
 *        description: error,
 *        code: 400 },
 *     }
 */
router.get("/users/:id", async (req, res) => {
  try {
    return await userController.findUserById(req, res);
  } catch (e) {
    const error = "Error when searching user by id ";
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
});

/**
 * @api {patch} /v1/users/me Patch user self
 * @apiVersion 1.0.0
 * @apiName PatchUserSelf
 * @apiGroup User
 *
 * @apiSuccess {json} object object with payload
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      status: true,
 *      payload: { login },
 *      error: null,
 * }
 *
 * @apiError {json} object object with error
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *      status: false,
 *      payload: null,
 *      error: {
 *        message: error,
 *        description: error,
 *        code: 400 },
 *     }
 */
router.patch("/users/me", async (req, res) => {
  try {
    return await userController.patchUserSelf(req, res);
  } catch (e) {
    const error = "Error when user patch self ";
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
});

/**
 * @api {put} /v1/users/:id Update user by id
 * @apiVersion 1.0.0
 * @apiName UpdateUserById
 * @apiGroup User
 *
 * @apiParam {Number} id User id
 *
 * @apiBody {String} type Type of user
 * @apiBody {String} login User login
 * @apiBody {String} password User password (min: 6)
 * @apiBody {String} email User email
 * @apiBody {String} userName User name
 * @apiBody {Base64} image data (only jpg, jpeg, png, gif)
 *
 * @apiSuccess {json} object object with payload
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      status: true,
 *      payload: { userId and other user fields },
 *      error: null,
 * }
 *
 * @apiError {json} object object with error
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *      status: false,
 *      payload: null,
 *      error: {
 *        message: error,
 *        description: error,
 *        code: 400 },
 *     }
 */
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
  async (req, res) => {
    try {
      return await userController.updateUserById(req, res);
    } catch (e) {
      const error = "Error when user update by id ";
      console.error(error + e.toString());
      res.status(500).json({
        status: false,
        payload: null,
        error: { message: error, description: e.toString(), code: 500 },
      });
    }
  }
);

/**
 * @api {delete} /v1/users/:id Delete user by id (Soft delete)
 * @apiVersion 1.0.0
 * @apiName DeleteUserById
 * @apiGroup User
 *
 * @apiParam {Number} id  User id
 *
 * @apiSuccess {json} object object with payload
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      status: true,
 *      payload: { userId and other user fields },
 *      error: null,
 * }
 * @apiError {json} object object with error
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *      status: false,
 *      payload: null,
 *      error: {
 *        message: error,
 *        description: error,
 *        code: 400 },
 *     }
 */
router.delete("/users/:id", async (req, res) => {
  try {
    return await userController.deleteUserById(req, res);
  } catch (e) {
    const error = "Error when delete user by id ";
    console.error(error + e.toString());
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 },
    });
  }
});

module.exports = router;
