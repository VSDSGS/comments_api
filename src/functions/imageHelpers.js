const Jimp = require("jimp");

const imageModule = {
  checkImageExtension: function (base64Data) {
    const supportedExtensions = /\.(jpg|jpeg|png)$/i;
    const base64String = Buffer.from(base64Data, "base64").toString("ascii");
    const matches = base64String.match(/^data:image\/([A-Za-z-+/]+);base64,/);

    if (!matches) {
      console.log("Invalid base64 image format");
      return false;
    }

    const extension = matches[1].toLowerCase();

    if (!supportedExtensions.test(extension)) {
      console.log(
        "Unsupported image extension. Only jpg, jpeg, png, and gif are allowed."
      );
      return false;
    }

    return true;
  },

  checkImageSize: async function (base64Data) {
    try {
      if (!this.checkImageExtension(base64Data)) {
        return false;
      }

      const image = await Jimp.read(Buffer.from(base64Data, "base64"));

      const width = image.bitmap.width;
      const height = image.bitmap.height;

      console.log("Width:", width, "Height:", height);

      const maxWidth = 240;
      const maxHeight = 320;

      if (width > maxWidth || height > maxHeight) {
        console.log(
          "Max width or height is too big. Image must be 320x240 max"
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking image:", error);
      return false;
    }
  },

  isBase64: function (str) {
    try {
      return Buffer.from(str, "base64").toString("base64") === str;
    } catch (err) {
      return false;
    }
  },

  isValidUrl: function (string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },
};

module.exports = imageModule;
