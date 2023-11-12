const Jimp = require('jimp')

const imageModule = {
  checkImageSize: async function (base64Data) {
    try {
      if (!this.checkImageExtension(base64Data)) {
        return false
      }

      const image = await Jimp.read(Buffer.from(base64Data, 'base64'))

      const width = image.bitmap.width
      const height = image.bitmap.height

      console.log('Width:', width, 'Height:', height)

      const maxWidth = 240
      const maxHeight = 320

      if (width > maxWidth || height > maxHeight) {
        console.log(
          'Max width or height is too big. Image must be 320x240 max'
        )
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking image:', error)
      return false
    }
  },

  isBase64: function (str) {
    try {
      return Buffer.from(str, 'base64').toString('base64') === str
    } catch (err) {
      return false
    }
  }
}

module.exports = imageModule
