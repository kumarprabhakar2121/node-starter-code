require("dotenv").config();
require("./config/database.config").connect();
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(logger("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to node starter code",
  });
});

const authRoute = require("./routes/auth.route");
app.use("/auth", authRoute);

module.exports = app;
