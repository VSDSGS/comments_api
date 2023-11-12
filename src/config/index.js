module.exports = {
  ...require('./default'),
  ...JSON.parse(JSON.stringify(require('./env')))
}
