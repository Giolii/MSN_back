const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const passport = require("passport");
const authenticateJWT = passport.authenticate("jwt", { session: false });

router.get("/all", authenticateJWT, userController.allUsers);
router.post("/update", authenticateJWT, userController.updateProfile);
router.post("/addFriend", authenticateJWT, userController.addFriend);
router.post("/removeFriend", authenticateJWT, userController.removeFriend);
router.get("/:username", authenticateJWT, userController.checkUsername);

module.exports = router;
