const db = require('../services/db')
const dbHelper = require('../functions/dbHelpers')
const { Comment } = require('../models/comment')
const dataHelpers = require('../functions/dataHelpers')
const jwt = require('jsonwebtoken')
const { jwtSecret } = require('../config')
const imageHelpers = require('../functions/imageHelpers')

exports.createComment = async (req, res) => {
  try {
    const { userName, email, homePage, replied, text, image } = req.body

    const preparedData = {
      userName,
      email,
      homePage
    }
    if (
      req.headers.authorization !== undefined &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      const token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, jwtSecret)

      const { userId } = decoded
      const response = await db.query('SELECT * FROM users WHERE id = $1', [
        userId
      ])
      preparedData.userName = response[0].userName
      preparedData.email = response[0].email
    }

    if (image && text) {
      return res
        .status(400)
        .json({ error: 'Only text or images are allowed simultaneously' })
    }

    if (text) {
      if (await dataHelpers.isTextWithinLimit(text)) {
        preparedData.text = text
      } else {
        return res.status(400).json({ error: 'Text is too large' })
      }
    } else if (image && (await imageHelpers.isBase64(image))) {
      preparedData.image = await dataHelpers.imageTransformer(image)
    } else {
      return res.status(400).json({ error: "Image isn't base 64 data" })
    }

    if (typeof replied === 'number') {
      const repliedId = parseInt(replied)

      const existingRecord = await db.query(
        'SELECT * FROM comments WHERE id = $1',
        [repliedId]
      )

      if (existingRecord.length > 0) {
        preparedData.replied = repliedId
      } else {
        return res.status(400).json({
          status: false,
          payload: null,
          error: {
            message: 'Comment does not exist',
            description: "You can't reply to a comment that isn't created",
            code: 422
          }
        })
      }
    }

    const { query, params } = db.createHelper(Comment, preparedData)
    if (query && params) {
      try {
        const row = await db.query(query, params)
        console.info('Comment was added')
        res.status(201).send({
          status: true,
          payload: row && row.length > 0 ? row[0] : {},
          error: null
        })
      } catch (error) {
        console.error(`Error while creating comment: ${error.toString()}`)
        res.status(500).json({
          status: false,
          payload: null,
          error: {
            message: 'Error while creating comment',
            description: error.toString(),
            code: 500
          }
        })
      }
    }
  } catch (e) {
    console.error(`Error in createComment: ${e.toString()}`)
    res.status(500).json({
      status: false,
      payload: null,
      error: {
        message: 'Error in createComment',
        description: e.toString(),
        code: 500
      }
    })
  }
}

exports.listAllComments = async (req, res) => {
  try {
    if (
      !req.headers?.authorization ||
      !req.headers?.authorization?.startsWith('Bearer ')
    ) {
      return res
        .status(401)
        .json({ status: false, message: 'Unauthorized: Token not found' })
    }
    let decoded
    const token = req.headers.authorization.split(' ')[1]
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (err) {
      return res.status(403).json({
        status: false,
        payload: null,
        error: {
          message: 'Invalid token',
          description: err.message,
          code: 403
        }
      })
    }
    const page = req.query.page || 1
    const isHideDeleted = req.query.deleted === 'true'
    const reverse = req.query.reverse === 'true'

    if (isHideDeleted) {
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          payload: null,
          error: 'Regular users cannot view deleted comments'
        })
      }
      return await dbHelper.listAllRecords(
        req,
        res,
        Comment,
        false,
        page,
        reverse
      )
    } else {
      return await dbHelper.listAllRecords(
        req,
        res,
        Comment,
        true,
        page,
        reverse
      )
    }
  } catch (e) {
    const error = 'Error in listAllComments'
    console.error(error + e.toString())
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
}

exports.findCommentsSelf = async (req, res) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer ')
  ) {
    return res
      .status(401)
      .json({ status: false, message: 'Unauthorized: Token not found' })
  }
  const token = req.headers.authorization.split(' ')[1]

  let decoded
  try {
    decoded = jwt.verify(token, jwtSecret)
  } catch (err) {
    return res.status(403).json({
      status: false,
      payload: null,
      error: {
        message: 'Invalid token',
        description: err.message,
        code: 403
      }
    })
  }

  const page = req.query.page || 1
  const isHideDeleted = req.query.deleted === 'true'
  const reverse = req.query.reverse === 'true'

  const userId = decoded.userId
  const response = await db.query('SELECT * FROM users WHERE id = $1', [
    userId
  ])
  if (isHideDeleted) {
    return await dbHelper.findModelByField(
      req,
      res,
      Comment,
      'email',
      response[0].email,
      false,
      page,
      reverse
    )
  } else {
    return await dbHelper.findModelByField(
      req,
      res,
      Comment,
      'email',
      response[0].email,
      true,
      page,
      reverse
    )
  }
}

exports.updateCommentById = async (req, res) => {
  try {
    if (
      !req.headers?.authorization ||
      !req.headers?.authorization?.startsWith('Bearer ')
    ) {
      return res
        .status(401)
        .json({ status: false, message: 'Unauthorized: Token not found' })
    }
    let decoded, userId, userRole
    const token = req.headers.authorization.split(' ')[1]
    try {
      decoded = jwt.verify(token, jwtSecret)
      userId = decoded.userId
      userRole = decoded.role
    } catch (err) {
      return res.status(403).json({
        status: false,
        payload: null,
        error: {
          message: 'Invalid token',
          description: err.message,
          code: 403
        }
      })
    }
    if (userRole !== 'admin') {
      return res.status(403).json({
        status: false,
        payload: null,
        error: {
          message: 'Access denied. Only admin has access to this route.',
          description: 'Access denied. Only admin has access to this route.',
          code: 403
        }
      })
    }

    const { userName, email, homePage, text, replied, image } = req.body

    if (!req.params.id) {
      return res.status(403).json({
        status: false,
        payload: null,
        error: {
          message: 'Access denied',
          description: 'Please provide existing comment ID',
          code: 403
        }
      })
    }

    const commentId = req.params.id

    const commentExists = await db.query(
      'SELECT * FROM comments WHERE id = $1',
      [commentId]
    )

    if (commentExists[0].length < 0) {
      return res
        .status(400)
        .json({ error: 'There are no comment with provided id' })
    }

    if (image && text) {
      return res
        .status(400)
        .json({ error: 'Only text or images are allowed simultaneously' })
    }

    const preparedData = {
      userName,
      email,
      homePage
    }

    if (text) {
      if (await dataHelpers.isTextWithinLimit(text)) {
        preparedData.text = text
      } else {
        return res.status(400).json({ error: 'Text is too large' })
      }
    } else if (image && (await imageHelpers.isBase64(image))) {
      preparedData.image = await dataHelpers.imageTransformer(image)
    } else {
      return res.status(400).json({ error: "Image isn't base 64 data" })
    }

    if (typeof replied === 'number') {
      const repliedId = parseInt(replied)

      const existingRecord = await db.query(
        'SELECT * FROM comments WHERE id = $1',
        [repliedId]
      )

      if (existingRecord.length > 0) {
        preparedData.replied = repliedId
      } else {
        return res.status(400).json({
          status: false,
          payload: null,
          error: {
            message: 'Comment does not exist',
            description: "You can't reply to a comment that isn't created",
            code: 422
          }
        })
      }
    }
    const { query, params } = db.updateHelper(Comment, commentId, preparedData)

    if (query && params) {
      const result = await db.query(query, params)

      console.log(
        `User with ID ${userId} updated a Comment with ID ${commentId}`
      )

      res.status(200).send({
        status: true,
        payload: result,
        error: null
      })
    } else {
      const error = 'Missed required field/s'
      console.error(error)

      return res.status(400).json({
        status: false,
        payload: null,
        error: { message: error, description: error, code: 400 }
      })
    }
  } catch (e) {
    const error = 'Error in updateCommentById'
    console.error(error + e.toString())

    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
}

exports.patchCommentById = async (req, res) => {
  try {
    if (
      !req.headers?.authorization ||
      !req.headers?.authorization?.startsWith('Bearer ')
    ) {
      return res
        .status(401)
        .json({ status: false, message: 'Unauthorized: Token not found' })
    }
    let decoded, userId
    const token = req.headers.authorization.split(' ')[1]
    try {
      decoded = jwt.verify(token, jwtSecret)
      userId = decoded.userId
    } catch (err) {
      return res.status(403).json({
        status: false,
        payload: null,
        error: {
          message: 'Invalid token',
          description: err.message,
          code: 403
        }
      })
    }

    const { userName, email, homePage, text, replied, image } = req.body

    if (!req.params.id) {
      return res
        .status(400)
        .json({ status: false, message: 'Comment ID not found' })
    }

    const commentId = req.params.id

    const commentExists = await db.query(
      'SELECT * FROM comments WHERE id = $1',
      [commentId]
    )
    if (commentExists[0].length < 0) {
      return res
        .status(400)
        .json({ error: 'There are no comment with provided id' })
    }

    const response = await db.query('SELECT * FROM users WHERE id = $1', [
      userId
    ])
    if (
      decoded.role !== 'admin' &&
      commentExists[0].email !== response[0].email
    ) {
      return res
        .status(400)
        .json({ error: 'You are allowed to update only your comments' })
    }

    if (image && text) {
      return res
        .status(400)
        .json({ error: 'Only text or images are allowed simultaneously' })
    }

    const preparedData = {
      userName,
      email,
      homePage
    }

    if (image && text) {
      return res
        .status(400)
        .json({ error: 'Only text or images are allowed simultaneously' })
    }

    if (text) {
      if (await dataHelpers.isTextWithinLimit(text)) {
        preparedData.text = text
      } else {
        return res.status(400).json({ error: 'Text is too large' })
      }
    } else if (image && (await imageHelpers.isBase64(image))) {
      preparedData.image = await dataHelpers.imageTransformer(image)
    }

    if (typeof replied === 'number') {
      const repliedId = parseInt(replied)

      const existingRecord = await db.query(
        'SELECT * FROM comments WHERE id = $1',
        [repliedId]
      )

      if (existingRecord.length > 0) {
        preparedData.replied = repliedId
      } else {
        return res.status(400).json({
          status: false,
          payload: null,
          error: {
            message: 'Comment does not exist',
            description: "You can't reply to a comment that isn't created",
            code: 422
          }
        })
      }
    }

    let restrictedFields
    if (decoded.role !== 'admin') {
      restrictedFields = ['userName', 'email', 'homePage', 'replied']
    } else {
      restrictedFields = []
    }

    if (req.body) {
      for (const field of restrictedFields) {
        if (req.body[field] !== undefined) {
          return res.status(403).json({
            status: false,
            payload: null,
            error: {
              message: `Access denied for updating the field '${field}'`,
              description: 'Only admin is allowed to make those changes',
              code: 403
            }
          })
        }
      }
    }
    if (userName !== undefined || email !== undefined) {
      preparedData.userName = response[0].userName
      preparedData.email = response[0].email
    }

    const { query, params } = db.patchHelper(Comment, commentId, preparedData)

    if (query && params) {
      const result = await db.query(query, params)

      console.log(
        `User with ID ${userId} updated a Comment with ID ${commentId}`
      )

      res.status(200).send({
        status: true,
        payload: result,
        error: null
      })
    } else {
      const error = 'Missed required field/s'
      console.error(error)

      return res.status(400).json({
        status: false,
        payload: null,
        error: { message: error, description: error, code: 400 }
      })
    }
  } catch (e) {
    const error = 'Error in patchCommentById'
    console.error(error + e.toString())

    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
}

exports.deleteCommentById = async (req, res) => {
  try {
    if (
      !req.headers?.authorization ||
      !req.headers?.authorization?.startsWith('Bearer ')
    ) {
      return res
        .status(401)
        .json({ status: false, message: 'Unauthorized: Token not found' })
    }
    let decoded
    const token = req.headers.authorization.split(' ')[1]
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (err) {
      return res.status(403).json({
        status: false,
        payload: null,
        error: {
          message: 'Invalid token',
          description: err.message,
          code: 403
        }
      })
    }

    if (!token) {
      return res.status(401).json({
        status: false,
        payload: null,
        error: {
          message: 'Unauthorized',
          description: 'No token provided',
          code: 401
        }
      })
    }

    const { role } = decoded || {}

    if (role !== 'admin') {
      return res.status(403).json({
        status: false,
        payload: null,
        error: {
          message: 'Invalid token',
          description: 'Only admin can delete users',
          code: 403
        }
      })
    }

    return await dbHelper.deleteModelById(req, res, Comment, true)
  } catch (e) {
    const error = 'Error in deleteCommentById'
    console.error(error + e.toString())

    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
}
