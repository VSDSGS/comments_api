const { Pool } = require('pg')
const { databaseURL } = require('../config')
const pool = new Pool({ connectionString: databaseURL })
const bcrypt = require('bcryptjs')

pool.on('error', (err) => {
  console.log('Unexpected error on idle client ' + err.toString())
  process.exit(-1)
})

module.exports = {
  query: async (text, params) => {
    try {
      console.log(
        `Have a db.query text: ${text}, params: ${JSON.stringify(params)}`
      )

      if (!text || text.length === 0) {
        console.error('An empty query was ignored')
        return []
      }

      const result = await pool.query(text, params)

      console.log(`SQL execution for the query text: ${text}`)
      return result.rows
    } catch (e) {
      console.error(`Error in db.query: ${e}`)
      return []
    }
  },

  createTable: async (model) => {
    try {
      let query = `CREATE TABLE IF NOT EXISTS ${model._tableName} ( `
      for (const field in model) {
        if (field.slice(0, 1) !== '_') {
          query += `"${field}" ${model[field].type}${
            model[field].unique ? ' UNIQUE' : ''
          }${model[field].primaryKey ? ' PRIMARY KEY' : ''}, `
        }
      }
      query = query.slice(0, -2)
      query += ');'
      await pool.query(query)
      console.info(`Table ${model._tableName} is successfully created!!`)
      if (model._tableName === 'users') {
        const hashedPass = await bcrypt.hash('1NzAwNzQzNyw', 12)
        await pool.query(
          'INSERT INTO users ( "type", "login", "email", "password", "userName", "image", "created", "updated", "deleted", "lastLogin") VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)  ON CONFLICT (login) DO NOTHING;',
          [
            'admin',
            'admin',
            'admin@gmail.com',
            hashedPass,
            'admin',
            null,
            new Date(),
            new Date(),
            null,
            null
          ]
        )
        console.info('Admin is granted!')
      }
    } catch (e) {
      if (!e.toString().includes('already exists')) {
        console.error(`Unexpected error on createTable ${model._tableName}`, e)
      }
      console.error('Error at createHelper: ' + e.toString())
    }
  },

  createHelper: (model, body) => {
    try {
      let query = `INSERT INTO ${model._tableName} ( `
      const params = []
      for (const field in model) {
        let value
        if (field.slice(0, 1) !== '_' && !model[field].primaryKey) {
          if (typeof body[field] === 'boolean') {
            value = body[field]
          } else if (body[field]) {
            value = body[field]
          } else if (model[field].defaultValue) {
            value = model[field].defaultValue
          } else if (model[field].allowNull) {
            value = typeof body[field] === 'number' ? body[field] : null
          } else if (field === 'created') {
            value = new Date()
          } else if (field === 'updated') {
            value = new Date()
          } else if (typeof body[field] === 'string') {
            value = ''
          } else {
            if (
              model._tableName === 'users' &&
              typeof body[field] === 'boolean'
            ) {
              value = body[field]
            } else {
              console.log(`Missed field ${field}`)
              return { error: `Missed field ${field}` }
            }
          }
          params.push(value)
          query += `"${field}", `
        }
      }
      if (params.length > 0) {
        query = query.slice(0, -2) + ') VALUES ( '
        for (const ind in params) {
          query += `$${1 + Number.parseInt(ind)}, `
        }
        query = query.slice(0, -2) + ') RETURNING *;'
        return { query, params }
      } else {
        return {}
      }
    } catch (e) {
      console.error(`Error at createHelper ${e.toString()} `)
    }
  },

  patchHelper: (model, id, body) => {
    let query = `UPDATE ${model._tableName} SET `
    const params = []

    for (const field in model) {
      if (
        model[field] &&
        !model[field].primaryKey &&
        !model[field].blockDirectAccess &&
        field !== 'created' &&
        field !== 'deleted'
      ) {
        if (body[field] !== undefined) {
          params.push(body[field])
          query += `"${field}" = $${params.length}, `
        }
      }
    }

    params.push(new Date())
    query += `updated = $${params.length} `

    if (params.length > 0) {
      query += `WHERE id = $${params.length + 1} RETURNING *;`
      params.push(id)
      return { query, params }
    } else {
      return {}
    }
  },

  updateHelper: (model, id, body) => {
    let query = `UPDATE ${model._tableName} SET `
    const params = []

    for (const field in model) {
      let value
      if (
        field.slice(0, 1) !== '_' &&
        !model[field].primaryKey &&
        !model[field].blockDirectAccess &&
        field !== 'created' &&
        field !== 'deleted'
      ) {
        if (body[field] !== undefined) {
          value = body[field]
        } else if (model[field].defaultValue !== undefined) {
          value = model[field].defaultValue
        } else if (model[field].allowNull) {
          value = null
        } else if (field === 'updated') {
          value = new Date()
        } else {
          throw new Error(`Field '${field}' is required for update`)
        }

        params.push(value)
        query += `"${field}" = $${params.length}, `
      }
    }

    if (params.length > 0) {
      query =
        query.slice(0, -2) + ` WHERE id = $${params.length + 1} RETURNING *;`
      params.push(id)
      return { query, params }
    } else {
      throw new Error('No fields to update')
    }
  }
}
