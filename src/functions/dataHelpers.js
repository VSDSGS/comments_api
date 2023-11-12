/* eslint-disable no-async-promise-executor */
/* eslint-disable prefer-promise-reject-errors */
const {
  maxUserFieldsLength,
  maxCommentTextWeight,
  allowedExtensions
} = require('../config')
const Jimp = require('jimp')

function removeBase64Prefix (base64String) {
  if (base64String.startsWith('data:image/jpeg;base64,')) {
    return base64String.replace('data:image/jpeg;base64,', '')
  }
  return base64String
}

module.exports = {
  imageTransformer: async function (fileOrBase64) {
    return new Promise(async (resolve, reject) => {
      fileOrBase64 = removeBase64Prefix(fileOrBase64)
      let imageBuffer

      if (fileOrBase64 instanceof Buffer) {
        if (!allowedExtensions.includes(fileOrBase64.mimetype.split('/')[1])) {
          return reject({
            error:
              "Only JPG, PNG or GIF files allowed at 'allowedExtensions.includes' check"
          })
        }
        imageBuffer = fileOrBase64.buffer
      } else if (typeof fileOrBase64 === 'string') {
        try {
          imageBuffer = Buffer.from(fileOrBase64, 'base64')
        } catch (base64Err) {
          return reject({
            error:
              "Invalid base64 data at 'Buffer.from(base64Err)' catch block"
          })
        }
      } else {
        return reject({
          error:
            'Invalid input. Expecting file or base64 data at the else block'
        })
      }

      try {
        const image = await Jimp.read(imageBuffer)

        if (image.bitmap.width > 320 || image.bitmap.height > 240) {
          const resizedImage = await image.resize(
            320,
            240,
            Jimp.RESIZE_BICUBIC
          )
          const base64String = await resizedImage.getBase64Async(Jimp.MIME_PNG)
          resolve(base64String) // Повертаємо змінене зображення у вигляді base64 строки
        } else {
          const base64String = await image.getBase64Async(Jimp.MIME_PNG)
          resolve(base64String) // Повертаємо оригінальне зображення у вигляді base64 строки
        }
      } catch (readErr) {
        reject({ error: `Error processing image: ${readErr.message}` })
      }
    })
  },

  validateStringLength: function (inputString) {
    const regex = new RegExp(`^.{0,${maxUserFieldsLength}}$`)
    return regex.test(inputString)
  },

  isTextWithinLimit: function (text) {
    const textBytes = Buffer.byteLength(text, 'utf8')
    if (textBytes > maxCommentTextWeight) {
      return false
    }
    return true
  }
}
