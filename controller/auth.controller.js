const UserModel = require("../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const find = await UserModel.findOne({ email });
    if (find) {
      return res.status(400).json({
        success: false,
        message: `Account already exists with email :${email}`,
      });
    }

    const user = new UserModel({
      name,
      email,
      password: await bcrypt.hash(password, 10),
    });
    user
      .save()
      .then((data) => {
        if (data) {
          return res.status(200).json({
            success: true,
            message: "User Signup Successful!",
          });
        }
        return res.status(400).json({
          success: false,
          message: "Error registering user!",
        });
      })
      .catch((error) => {
        return res.status(400).json({
          success: false,
          message: error.message,
          error,
        });
      });
  } catch (error) {
    // server error
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password)) {
      return res.status(300).json({
        success: false,
        message: "Enter your email address and password",
      });
    }
    UserModel.findOne({ email })
      .then(async (data) => {
        const validPassword = await bcrypt.compare(
          req.body.password,
          data.password
        );
        if (validPassword) {
          console.log("password matched");
          // login
          data.password = undefined;
          const token = jwt.sign({ _id: data._id }, JWT_SECRET);

          const options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            httpOnly: true,
          };
          return res.status(200).cookie("token", token, options).json({
            success: true,
            msg: "Login successful",
            token,
          });
        } else {
          console.log("password not matched");
          // wrong password
          return res.status(401).json({
            success: false,
            msg: "Wrong password",
          });
        }
      })
      .catch((err) => {
        res.status(300).json({
          success: false,
          message: err.message,
          error: err,
        });
        throw new Error(err);
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error,
    });
    throw new Error(error);
  }
};

const secret = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "This is a secret route, only logged in users can see this.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error,
    });
  }
};

const logout = async (req, res) => {
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "Logout success",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error,
    });
  }
};

const users = async (req, res) => {
  try {
    let page;
    let limit;
    page = parseInt(req.query.page) || 1;
    limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = {};
    const length = await UserModel.countDocuments().exec();
    result.total_count = length;
    result.total_pages = Math.ceil(length / limit);
    if (result.total_pages < page) {
      result.msg = "Page Number exceeds limit!";
      result.results = [];
      return res.json(result);
    }
    if (endIndex < length) {
      result.next = {
        page: page + 1,
        limit: limit,
      };
    }
    if (startIndex > 0) {
      result.previous = {
        page: page - 1,
        limit: limit,
      };
    }

    result.results = await UserModel
      .find(
        {},
        {
          __v: 0,
          updatedAt: 0,
          createdAt: 0,
        }
      )
      .limit(limit)
      .skip(startIndex);
    res.paginatedResult = result;
    return res.json(result);
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: e,
    });
  }
};

module.exports = {
  secret,
  login,
  signup,
  logout,
  users,
};
