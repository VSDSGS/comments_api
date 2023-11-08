module.exports = {
  isTextWithinLimit: async function (text) {
    const textBytes = Buffer.byteLength(text, "utf8");
    if (textBytes > 100 * 1024) {
      return false;
    }
    return true;
  },
};
