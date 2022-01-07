require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./model/user");
const { auth } = require("./middleware/auth");
const cookieParser = require("cookie-parser");
const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("<h1>auth system -lco</h1>");
});

app.post("/register", async (req, res) => {
  console.log(req.body);
  try {
    const { firstname, lastname, email, password } = req.body;
    if (!(email && password && firstname && lastname)) {
      res.status(400).send("All fields are required.");
    } else {
      const existingUser = await User.findOne({
        email,
      }); //PROMISE
      if (existingUser) {
        res.status(400).send("User already exists");
      }
      const user = await User.create({
        firstname,
        lastname,
        email: email.toLowerCase(),
        password,
      });
      //token
      const token = jwt.sign(
        {
          user_id: user._id,
          email,
        },
        process.env.SECRET_KEY
      );
      user.token = token;
      User.updateOne(
        { email: req.body.email },
        { $set: req.body },
        function (err) {
          if (!err) {
            res.send("Successfully updated token");
          }
        }
      );
      //update or not
      user.password = undefined;
      res.status(201).json(user);
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send("required Field is missing ");
    }
    const user = await User.findOne({
      email,
    });
    if (user && password == user.password) {
      const token = jwt.sign(
        {
          user_id: user._id,
          email,
        },
        process.env.SECRET_KEY
      );
      user.token = token;
      user.password = undefined;

      // res.status(200).json(user);
      //  want to use cookies
      const options = {
        expires: new Date(Date.now() * 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.status(200).cookie("token", token, options).json({
        success: true,
        token,
        user,
      });

      console.log("User Authenticated successfully ");
    } else {
      res.status(400).send("email or password is incorrect");
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/dashboard", auth, (req, res) => {
  res.send("Welcome to secret information");
});

app.get("/users", (req, res) => {
  const users = User.find({}, (err, users) => {
    if (err) {
      console.log(err);
    } else {
      res.send(users);
    }
  });
});

app.post("/logout", auth, async (req, res) => {
  console.log(req.cookie);
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  //send JSON response for success
  res.status(200).json({
    succes: true,
    message: "Logout success",
  });
});

module.exports = app;
