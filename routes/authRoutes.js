const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const passport = require("passport");
const authenticateJWT = passport.authenticate("jwt", { session: false });

router.post("/register", authController.signup);
router.post("/login", authController.login);
router.get("/me", authenticateJWT, authController.authenticateMe);
router.post("/guest", authController.guest);

module.exports = router;
