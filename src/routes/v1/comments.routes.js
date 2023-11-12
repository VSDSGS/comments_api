const router = require('express')()
const commentsController = require('../../controllers/comments.controller')
const validator = require('../../middleware/validate.middleware')

/**
 * @api {post} /v1/comments Create Comment (Only text or image simultaneously)
 * @apiVersion 1.0.0
 * @apiName CreateComment
 * @apiGroup Comment
 *
 * @apiBody {String} userName user name
 * @apiBody {String} email user email
 * @apiBody {String} text comment text
 * @apiBody {String} homePage user home page (max 100kb)
 * @apiBody {String} Replied comment replied to
 * @apiBody {Base64} image data (only jpg, jpeg, png, gif)
 *
 * @apiSuccess {json} object object with payload
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
        response
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
router.post('/comments', validator, async (req, res) => {
  try {
    return await commentsController.createComment(req, res)
  } catch (e) {
    const error = 'Error when creating comment '
    console.error(error + e.toString())
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
})

/**
 * @api {get} /v1/comments Get all comments (If logged in)
 * @apiVersion 1.0.0
 * @apiName ListAllComments
 * @apiGroup Comment
 * @apiParam {number} Page Page number
 * @apiParam {boolean} Reverse Reverse array
 * @apiParam {boolean} Deleted True or False (Only for admin)
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
router.get('/comments', async (req, res) => {
  try {
    return await commentsController.listAllComments(req, res)
  } catch (e) {
    const error = 'Error when getting asll comments '
    console.error(error + e.toString())
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
})

/**
 * @api {get} /v1/comments/me Get user created self comments
 * @apiVersion 1.0.0
 * @apiName FindCommentsSelf
 * @apiGroup Comment
 * @apiParam {number} Page Page number
 * @apiParam {boolean} Reverse Reverse array
 * @apiParam {boolean} Deleted True or False (Only for admin)
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
router.get('/comments/me', async (req, res) => {
  try {
    return await commentsController.findCommentsSelf(req, res)
  } catch (e) {
    const error = 'Error when getting asll comments '
    console.error(error + e.toString())
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
})

/**
 * @api {put} /v1/comments/:id Update comment by id (Only admin)
 * @apiVersion 1.0.0
 * @apiName UpdateCommentById
 * @apiGroup Comment
 *
 * @apiParam {Number} id Comment id
 *
 * @apiBody {String} userName user name
 * @apiBody {String} email user email
 * @apiBody {String} text comment text
 * @apiBody {String} homePage user home page (max 100kb)
 * @apiBody {String} Replied comment replied to
 * @apiBody {Base64} image data (only jpg, jpeg, png, gif)
 *
 * @apiSuccess {json} object object with payload
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      status: true,
 *      payload: { response },
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
router.put('/comments/:id', async (req, res) => {
  try {
    return await commentsController.updateCommentById(req, res)
  } catch (e) {
    const error = 'Error when updating comment by id '
    console.error(error + e.toString())
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
})

/**
 * @api {patch} /v1/comments/id Patch user's comment by id
 * @apiVersion 1.0.0
 * @apiName PatchCommentById
 * @apiGroup Comment
 *
 * @apiParam {Number} id Comment id
 *
 * @apiSuccess {json} object object with payload
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      status: true,
 *      payload: { response },
 *      error: null,
 *     }
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
router.patch('/comments/:id', async (req, res) => {
  try {
    return await commentsController.patchCommentById(req, res)
  } catch (e) {
    const error = 'Error when patching comment by id '
    console.error(error + e.toString())
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
})

/**
 * @api {delete} /v1/comments/:id Delete comment by id (Soft delete)
 * @apiVersion 1.0.0
 * @apiName DeleteCommentById
 * @apiGroup Comment
 *
 * @apiParam {Number} id Comment id
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
router.delete('/comments/:id', async (req, res) => {
  try {
    return await commentsController.deleteCommentById(req, res)
  } catch (e) {
    const error = 'Error when patching comment by id '
    console.error(error + e.toString())
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
})

module.exports = router
