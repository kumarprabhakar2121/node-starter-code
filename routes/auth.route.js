const router = require("express").Router();
const authController = require("../controller/auth.controller");
const { isLoginCheck } = require("../middleware/auth.middleware");

router.route("/secret-page").get(isLoginCheck, authController.secret);

router.route("/signup").post(authController.signup);

router.route("/login").post(authController.login);

router.route("/get-my-account").get(isLoginCheck, authController.getMyAccount);

router.route("/logout").get(isLoginCheck, authController.logout);

router.route("/users/").get(authController.users);

router.route("/verify-otp").post(authController.verifyOTP);

router.route("/request-otp").post(authController.requestOTP);

module.exports = router;
