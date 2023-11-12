const express = require('express')
const helmet = require('helmet')
const rTracer = require('cls-rtracer')
const { port } = require('./config')
const cors = require('cors')
const xss = require('xss')

const app = express()
console.info('----------Starting server----------')
app.use(express.json())

app.use(rTracer.expressMiddleware())
app.use(helmet())

const html = xss('<script>alert("xss");</script>')
console.log(html)

app.use(cors())

app.use('/', require('./routes'));

(async () => {
  try {
    await require('./models/index').createTables()

    app.listen(port || 5500, () =>
      console.log(`listening at http://localhost:${port || 5500}`)
    )
  } catch (e) {
    console.log('Server Error ' + e.toString())
    process.exit(1)
  }
})()
