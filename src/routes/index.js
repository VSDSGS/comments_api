const router = require('express')()

router.use('/v1', require('./v1'))

module.exports = router
