const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const passport = require("passport");
const authenticateJWT = passport.authenticate("jwt", { session: false });

router.get("/users", authenticateJWT, authController.allUsers);
router.post("/register", authController.signup);
router.post("/update", authenticateJWT, authController.updateProfile);
router.post("/addFriend", authenticateJWT, authController.addFriend);
router.post("/removeFriend", authenticateJWT, authController.removeFriend);
router.post("/admin", authenticateJWT, authController.becomeAdmin);
router.post("/login", authController.login);
router.post("/guest", authController.guest);
router.get("/me", authenticateJWT, authController.authenticateMe);
router.get("/:username", authenticateJWT, authController.checkUsername);

module.exports = router;
