const bcrypt = require('bcryptjs')
const { User } = require('../models/user')
const db = require('../services/db')
const dbHelper = require('../functions/dbHelpers')
const dataHelper = require('../functions/dataHelpers')
const jwt = require('jsonwebtoken')
const {
  jwtSecret,
  jwtLongExpiresIn,
  jwtExpiresIn,
  maxUserFieldsLength
} = require('../config')
const imageHelper = require('../functions/imageHelpers')

exports.createUser = async (req, res) => {
  try {
    let { type, login, email, password, userName, image } = req.body

    let decoded
    if (
      req.headers?.authorization ||
      req.headers?.authorization?.startsWith('Bearer ')
    ) {
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
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          status: false,
          payload: null,
          error: {
            message: 'You have no permission to create new users',
            description: 'Creating new user is not allowed while logged in',
            code: 403
          }
        })
      }
    } else if (
      !req.headers?.authorization?.startsWith('Bearer ') &&
      type === 'admin'
    ) {
      return res.status(403).json({
        status: false,
        payload: null,
        error: {
          message: 'You have no permission to create new users',
          description: 'Creating new admin user is not allowed',
          code: 403
        }
      })
    }

    if (!type || !login || !email || !password || !userName) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Missing required fields',
          description: 'Required fields are missing',
          code: 422
        }
      })
    }

    if (
      typeof type !== 'string' ||
      typeof login !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof userName !== 'string' ||
      (type !== 'admin' && type !== 'user')
    ) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Incorrect data type in one or more fields',
          description: 'One or more fields have incorrect data type',
          code: 422
        }
      })
    }

    if (image) {
      image = await dataHelper.imageTransformer(image)
    }

    if (!dataHelper.validateStringLength(login)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Login length is too large',
          description: `Login must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    } else if (!dataHelper.validateStringLength(email)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Email length is too large',
          description: `Email must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    } else if (!dataHelper.validateStringLength(userName)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'User name length is too large',
          description: `User name must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    } else if (!dataHelper.validateStringLength(password)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'User password length is too large',
          description: `User password must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    }

    const lowerCaseEmail = email.toLowerCase()
    const lowerCaseLogin = login.toLowerCase()

    const candidateCountEmailQuery = await db.query(
      'SELECT COUNT(email) FROM users WHERE LOWER(email) = $1',
      [lowerCaseEmail]
    )

    const candidateCountLoginQuery = await db.query(
      'SELECT COUNT(login) FROM users WHERE LOWER(login) = $1',
      [lowerCaseLogin]
    )

    const candidateCountEmail =
      candidateCountEmailQuery && candidateCountEmailQuery[0]
        ? candidateCountEmailQuery[0].count
        : 0

    const candidateCountLogin =
      candidateCountLoginQuery && candidateCountLoginQuery[0]
        ? candidateCountLoginQuery[0].count
        : 0

    if (parseInt(candidateCountEmail) > 0) {
      const error = 'User with this email exists'
      console.log(error)
      return res.status(403).json({
        status: false,
        payload: null,
        error: { message: error, description: error, code: 403 }
      })
    }

    if (parseInt(candidateCountLogin) > 0) {
      const error = 'User with this login exists'
      console.log(error)
      return res.status(403).json({
        status: false,
        payload: null,
        error: { message: error, description: error, code: 403 }
      })
    }

    if (
      !password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d#?!@$%&-]{6,}$/)
    ) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Password should satisfy rules',
          description: 'Password should satisfy rules',
          code: 422
        }
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const { query, params } = db.createHelper(User, {
      type,
      login: lowerCaseLogin,
      email: lowerCaseEmail,
      password: hashedPassword,
      userName,
      image
    })

    if (query && params) {
      const result = await db.query(query, params)
      const user = result && result.length > 0 ? result[0] : {}

      if (!user || Object.keys(user).length === 0) {
        const error = 'Error when trying to create a user'
        console.log(error)
        return res.status(400).json({
          status: false,
          payload: null,
          error: { message: error, description: error, code: 400 }
        })
      }

      res.status(201).send({
        status: true,
        payload: dbHelper.removeFieldWithBlockDirectAccess(user, User),
        error: null
      })
    } else {
      const error = 'Missing required field/s'
      console.log(error)
      return res.status(400).json({
        status: false,
        payload: null,
        error: { message: error, description: error, code: 400 }
      })
    }
  } catch (e) {
    const error = `Error in createUser: ${e.toString()}`
    console.error(error)
    res.status(500).json({
      status: false,
      payload: null,
      error: {
        message: 'Error in createUser',
        description: e.toString(),
        code: 500
      }
    })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    const response = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = $1',
      [email]
    )

    if (response.length === 0) {
      const error = 'Wrong email or password'
      return res.status(400).json({
        status: false,
        payload: null,
        error: { message: error, description: error, code: 400 }
      })
    }

    const user = response[0]

    if (user.deleted !== null) {
      const error = 'User is banned'
      return res.status(403).json({
        status: false,
        payload: null,
        error: { message: error, description: error, code: 403 }
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      const error = 'Wrong email or password'
      return res.status(400).json({
        status: false,
        payload: null,
        error: { message: error, description: error, code: 400 }
      })
    }

    const role = user.type === 'admin' ? 'admin' : 'user'
    const expiresIn = role === 'admin' ? jwtLongExpiresIn : jwtExpiresIn

    const token = jwt.sign({ userId: user.id, role }, jwtSecret, {
      expiresIn
    })

    const { query, params } = db.patchHelper(User, user.id, {
      lastLogin: new Date()
    })
    if (query && params) {
      await db.query(query, params)
    }

    res.json({
      status: true,
      payload: { token, userId: user.id },
      error: null
    })
  } catch (e) {
    const error = 'Error during user login'
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
}

exports.listAllUsers = async (req, res) => {
  try {
    if (
      !req.headers?.authorization ||
      !req.headers?.authorization?.startsWith('Bearer ')
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

    if (decoded.role !== 'admin') {
      return res.status(403).json({ status: false, message: 'Access denied' })
    }

    const page = req.query.page || 1
    const isHideDeleted = req.query.deleted === 'true'
    const reverse = req.query.reverse === 'true'

    if (isHideDeleted) {
      return await dbHelper.listAllRecords(
        req,
        res,
        User,
        false,
        page,
        reverse
      )
    } else {
      return await dbHelper.listAllRecords(req, res, User, true, page, reverse)
    }
  } catch (e) {
    const error = 'Error in listAllUsers'
    console.error(error + e.toString())
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
}

exports.findUserSelf = async (req, res) => {
  try {
    if (
      !req.headers?.authorization ||
      !req.headers?.authorization?.startsWith('Bearer ')
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

    const userId = decoded.userId

    if (!userId) {
      return res
        .status(400)
        .json({ status: false, message: 'User ID not found in token' })
    }

    const response = await db.query('SELECT * FROM users WHERE id = $1', [
      userId
    ])

    res.json({
      status: true,
      payload: dbHelper.removeFieldWithBlockDirectAccess(
        response.length > 0 ? response[0] : null,
        User
      ),
      error: null
    })
  } catch (e) {
    const error = 'Error in findUserSelf'
    console.error(error + e.toString())
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
}

exports.findUserById = async (req, res) => {
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
    const userRole = decoded.role

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

    const userId = req.params.id

    if (!userId) {
      return res
        .status(400)
        .json({ status: false, message: 'User ID not found' })
    }

    const response = await db.query('SELECT * FROM users WHERE id = $1', [
      userId
    ])

    res.json({
      status: true,
      payload: dbHelper.removeFieldWithBlockDirectAccess(
        response.length > 0 ? response[0] : null,
        User
      ),
      error: null
    })
  } catch (e) {
    const error = 'Error in findUserById'
    console.error(error + e.toString())
    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
}

exports.updateUserById = async (req, res) => {
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

    const { type, login, email, password, userName, image } = req.body

    const allowedTypes = ['admin', 'user']
    if (type && !allowedTypes.includes(type)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Only admin or user types are allowed',
          description: 'Only admin or user types are allowed',
          code: 422
        }
      })
    }

    if (!req.params.id) {
      return res.status(403).json({
        status: false,
        payload: null,
        error: {
          message: 'Access denied',
          description: 'Please provide existing user ID',
          code: 403
        }
      })
    }

    const userId = req.params.id

    const userExists = await db.query('SELECT * FROM users WHERE id = $1', [
      userId
    ])

    if (userExists.length === 0) {
      return res.status(400).json({
        status: false,
        payload: null,
        error: {
          message: 'User not found',
          description: 'There is no user with provided ID',
          code: 403
        }
      })
    }

    const { role } = decoded || {}

    if (role !== 'admin') {
      return res.status(403).json({
        status: false,
        payload: null,
        error: {
          message: 'Access denied',
          description: 'Only admin can make such changes',
          code: 403
        }
      })
    }

    let restrictedFields
    if (role !== 'admin') {
      restrictedFields = ['type', 'created', 'updated', 'lastLogin']
    } else {
      restrictedFields = []
    }

    if (!dataHelper.validateStringLength(login)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Login length is too large',
          description: `Login must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    } else if (!dataHelper.validateStringLength(email)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Email length is too large',
          description: `Email must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    } else if (!dataHelper.validateStringLength(userName)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'User name length is too large',
          description: `User name must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    } else if (!dataHelper.validateStringLength(password)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'User password length is too large',
          description: `User password must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    }

    if (image) {
      if (imageHelper.isBase64(image)) {
        req.body.image = await dataHelper.imageTransformer(req.body.image)
      } else {
        return res.status(400).json({
          status: false,
          payload: null,
          error: {
            message: 'No valid base 64 image',
            description: 'Image must be in base 64 format',
            code: 403
          }
        })
      }
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

    req.body.login = req.body.login.toLowerCase()
    req.body.email = req.body.email.toLowerCase()

    if (req.body && req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 12)
    }

    if (login || email) {
      const userExists = await db.query(
        'SELECT * FROM users WHERE id <> $1 AND (login = $2 OR email = $3)',
        [userId, login, email]
      )
      if (userExists && userExists.length > 0) {
        return res.status(403).json({
          status: false,
          payload: null,
          error: {
            message: 'Login or Email already exists for another user',
            description: 'Login or Email already exists for another user',
            code: 403
          }
        })
      }
    }

    const { query, params } = db.updateHelper(User, userId, req.body)

    if (query && params) {
      const result = await db.query(query, params)

      console.log(
        `User with ID ${userId} is updated by User ${
          decoded ? decoded.userId : 'Unknown'
        }`
      )

      res.status(200).send({
        status: true,
        payload: dbHelper.removeFieldWithBlockDirectAccess(
          result && result.length > 0 ? result[0] : {},
          User
        ),
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
    const error = 'Error in updateUserById'
    console.error(error + e.toString())

    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
}

exports.patchUserSelf = async (req, res) => {
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

    const { role } = decoded || {}

    let { type, login, email, password, userName, image } = req.body

    if (!dataHelper.validateStringLength(login)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Login length is too large',
          description: `Login must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    } else if (!dataHelper.validateStringLength(email)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Email length is too large',
          description: `Email must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    } else if (!dataHelper.validateStringLength(userName)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'User name length is too large',
          description: `User name must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    } else if (!dataHelper.validateStringLength(password)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'User password length is too large',
          description: `User password must be within ${maxUserFieldsLength} characters`,
          code: 422
        }
      })
    }

    const allowedTypes = ['admin', 'user']
    if (type && !allowedTypes.includes(type)) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Only admin or user types are allowed',
          description: 'Only admin or user types are allowed',
          code: 422
        }
      })
    }

    if (
      ![type, login, email, password, userName, image].every(
        (field) => typeof field === 'string' || field === undefined
      )
    ) {
      return res.status(422).json({
        status: false,
        payload: null,
        error: {
          message: 'Incorrect data type in one or more fields',
          description: 'One or more fields have incorrect data type',
          code: 422
        }
      })
    }

    let restrictedFields
    if (role !== 'admin') {
      restrictedFields = ['type', 'created', 'updated', 'lastLogin']
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

    if (password) {
      password = await bcrypt.hash(req.body.password, 12)
    }

    if (login !== undefined) {
      req.body.login = login.toLowerCase()
    }
    if (email !== undefined) {
      req.body.email = email.toLowerCase()
    }

    if (req.body.image) {
      image = await dataHelper.imageTransformer(req.body.image)
    }

    if (req.body.login || req.body.email) {
      const userExists = await db.query(
        'SELECT * FROM users WHERE id <> $1 AND (login = $2 OR email = $3)',
        [userId, login, email]
      )
      if (userExists && userExists.length > 0) {
        return res.status(403).json({
          status: false,
          payload: null,
          error: {
            message: 'Login or Email already exists for another user',
            description: 'Login or Email already exists for another user',
            code: 403
          }
        })
      }
    }

    console.log(req.body)

    const { query, params } = db.patchHelper(User, userId, req.body)

    if (query && params) {
      const result = await db.query(query, params)

      console.log(
        `User with ID ${userId} updated his information
        }`
      )

      res.status(200).send({
        status: true,
        payload: dbHelper.removeFieldWithBlockDirectAccess(
          result && result.length > 0 ? result[0] : {},
          User
        ),
        error: null
      })
    } else {
      const error = 'Nothing to patch'
      console.error(error)

      return res.status(400).json({
        status: false,
        payload: null,
        error: { message: error, description: error, code: 400 }
      })
    }
  } catch (e) {
    const error = 'Error in patchUserSelf'
    console.error(error + e.toString())

    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
}

exports.deleteUserById = async (req, res) => {
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

    return await dbHelper.deleteModelById(req, res, User, true)
  } catch (e) {
    const error = 'Error in deleteUserById'
    console.error(error + e.toString())

    res.status(500).json({
      status: false,
      payload: null,
      error: { message: error, description: e.toString(), code: 500 }
    })
  }
}
