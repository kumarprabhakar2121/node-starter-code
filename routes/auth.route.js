const router = require("express").Router();
const authController = require("../controller/auth.controller");
const { isLoginCheck } = require("../middleware/auth.middleware");

router.route("/secret-page").get(isLoginCheck, authController.secret);

router.route("/signup").post(authController.signup);

router.route("/login").post(authController.login);

router.route("/logout").get(isLoginCheck, authController.logout);

router.route("/users/list").get(isLoginCheck, authController.users);

module.exports = router;
