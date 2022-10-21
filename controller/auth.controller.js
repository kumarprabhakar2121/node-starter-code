const UserModel = require("../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const nodemailer = require("nodemailer");
const { createMessage, mailConfig } = require("../config/nodemailer.config");
const getSixDigitOTP = require("../helper/getSixDigitOTP");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!(email && password && name)) {
      return res.status(400).json({
        success: false,
        message: "Enter name, email and password",
      });
    }

    const find = await UserModel.findOne({ email });
    if (find) {
      return res.status(400).json({
        success: false,
        message: `Account already exists with email :${email}`,
      });
    }
    let otp = await getSixDigitOTP();
    const user = new UserModel({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      otpDetails: { otp, expiresAt: Date.now() },
    });
    user
      .save()
      .then(async (data) => {
        if (data) {
          let transporter = await nodemailer.createTransport(
            await mailConfig()
          );

          const mailStatus = await transporter.sendMail(
            await createMessage(email, otp)
          );
          return res.status(200).json({
            success: true,
            message: `User Signup Successful! Verify OTP Now`,
            mailStatus: mailStatus.response,
          });
        }
        return res.status(400).json({
          success: false,
          message: `Error registering user!`,
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

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    UserModel.findOne({ email }, { otpDetails: 1, _id: 1 })
      .then((data) => {
        if (data) {
          console.log({ data });
          const oldDate = data.otpDetails.expiresAt;
          const newDate = Date.now();
          let diffInSec = (newDate - oldDate) / 1000;
          console.log(
            `Time difference = ${(newDate - oldDate) / 1000} seconds`
          );
          // console.log({ diffInSec });
          if (diffInSec > 600) {
            return res.status(400).json({
              success: false,
              message: `Time Expired! Request for new OTP`,
            });
          }
          if (otp !== data.otpDetails.otp) {
            return res.status(400).json({
              success: false,
              message: "WRONG OTP! TRY AGAIN",
            });
          }
          console.log("OTP MATCH");
          UserModel.findByIdAndUpdate(
            data._id,
            {
              $set: {
                isVerified: true,
              },
            },
            { new: true }
          )
            .then((updatedData) => {
              if (updatedData) {
                return res.status(200).json({
                  success: true,
                  message: "User verified successfully",
                  userDetails: {
                    name: updatedData.name,
                    isVerified: updatedData.isVerified,
                  },
                });
              }
              return res.status(400).json({
                success: false,
                message: "User not found ",
              });
            })
            .catch((error) => {
              return res.status(400).json({
                success: false,
                message: error?.message,
                error,
              });
            });
        }
      })
      .catch((error) => {
        return res.status(400).json({
          success: false,
          message: error?.message,
          error,
        });
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error,
    });
  }
};

const getMyAccount = async (req, res) => {
  try {
    const id = req.user._id;
    UserModel.findById(id, { password: 0, __v: 0 })
      .then((user) => {
        if (user) {
          return res.status(200).json({
            success: true,
            message: "Account Details Found",
            userData: user,
          });
        }
        return res.status(400).json({
          success: true,
          message: "Account Details Not Found",
        });
      })
      .catch((error) => {
        return res.status(400).json({
          success: true,
          message: "Error fetching account details",
          error,
        });
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

    result.results = await UserModel.find(
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

const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Enter your email address to request OTP",
      });
    }
    const find = await UserModel.findOne({ email });
    if (!find) {
      return res.status(400).json({
        success: false,
        message: `Account does not exists with email :${email}`,
      });
    }
    if (find.isVerified) {
      return res.status(400).json({
        success: false,
        message: `Account is already verified`,
      });
    }
    let otp = await getSixDigitOTP();
    let otpDetails = {
      otp,
      expiresAt: Date.now(),
    };
    UserModel.findByIdAndUpdate(
      find._id,
      { $set: { otpDetails } },
      { new: true }
    )
      .then(async (data) => {
        if (data) {
          let transporter = await nodemailer.createTransport(
            await mailConfig()
          );

          const mailStatus = await transporter.sendMail(
            await createMessage(email, otp)
          );

          if (mailStatus) {
            return res.status(200).json({
              success: true,
              message: "OTP Sent to Email Address",
              mailStatus: mailStatus.response,
            });
          }
          return res.status(400).json({
            success: false,
            message: "Error sending email",
          });
        }
      })
      .catch();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error,
    });
  }
};
module.exports = {
  secret,
  login,
  signup,
  logout,
  users,
  getMyAccount,
  verifyOTP,
  requestOTP,
};
