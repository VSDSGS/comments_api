const router = require("express")();
const Jimp = require("jimp");

router.post("/upload", async (req, res) => {
  if (!req.files || !req.files.image) {
    return res.status(400).json({ error: "The file wasn't downloaded" });
  }

  const image = req.files.image;

  if (
    image.mimetype !== "image/jpeg" &&
    image.mimetype !== "image/png" &&
    image.mimetype !== "image/gif"
  ) {
    return res.status(400).json({ error: "Only JPG, PNG or GIF files allowed" });
  }

  Jimp.read(image.data, (err, img) => {
    if (err) {
      return res.status(500).json({ error: "Error reading file" });
    }

    if (img.bitmap.width > 320 || img.bitmap.height > 240) {
      img.resize(320, 240);

      img.getBuffer(Jimp.MIME_JPEG, (saveErr, buffer) => {
        if (saveErr) {
          return res.status(500).json({ error: "Error processing image" });
        }

        res.writeHead(200, {
          "Content-Type": "image/jpeg",
          "Content-Length": buffer.length,
        });
        res.end(buffer);
      });
    } else {
      res.writeHead(200, {
        "Content-Type": image.mimetype,
        "Content-Length": image.data.length,
      });
      res.end(image.data);
    }
  });
});

module.exports = router;