const jwt = require("jsonwebtoken");
// const jwtr = require("jwtr");
var redis = require("redis");
var JWTR = require("jwt-redis").default;
var redisClient = redis.createClient();
var jwtr = new JWTR(redisClient);

//model is optional

const auth = (req, res, next) => {
  console.log("auth is running ");
  var token = "";
  try {
    token =
      req.body.token ||
      req.cookies.token ||
      req.header("Authorization").replace("Bearer ", "");
  } catch (error) {}

  if (!token) {
    res.status(403).json({
      success: false,
      message: "   You are not logged in   ( token missing) ",
    });
  } else {
    try {
      const decode = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decode;

      return next();
    } catch (error) {
      console.log("invalid token");
      return res
        .status(401)
        .json({ success: false, message: " Invalid token" });
    }
  }
};

module.exports = {
  auth,
};
