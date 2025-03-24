const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const passport = require("passport");
const authenticateJWT = passport.authenticate("jwt", { session: false });

router.post("/register", authController.signup);
router.post("/login", authController.login);
router.get("/me", authenticateJWT, authController.authenticateMe);
// Login Guest
router.post("/guest", authController.guest);

// User route
// router.get("/users", authenticateJWT, authController.allUsers);
// router.post("/update", authenticateJWT, authController.updateProfile);
// router.get("/:username", authenticateJWT, authController.checkUsername);
// router.post("/addFriend", authenticateJWT, authController.addFriend);
// router.post("/removeFriend", authenticateJWT, authController.removeFriend);

module.exports = router;
