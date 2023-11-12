const router = require('express')()

router.use('/', require('./user.routes'))
router.use('/', require('./comments.routes'))

module.exports = router
