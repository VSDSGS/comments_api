const express = require("express");
const fileUpload = require("express-fileupload");
const helmet = require("helmet");
const rTracer = require("cls-rtracer");
const { port } = require("./config");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(rTracer.expressMiddleware());
app.use(helmet());

app.use("/", require("./routes"));

(async () => {
  try {
    await require("./models/index").createTables();

    app.listen(port || 5000, () =>
      console.log(`listening at http://localhost:${port || 5000}`)
    );
  } catch (e) {
    console.log("Server Error " + e.toString());
    process.exit(1);
  }
})();
