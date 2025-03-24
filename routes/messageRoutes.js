const express = require("express");
const router = express.Router();
const messagesController = require("../controllers/messagesController");
const passport = require("passport");
const authenticateJWT = passport.authenticate("jwt", { session: false });

router.get("/:id", authenticateJWT, messagesController.fetchMessages);
router.post("/new", authenticateJWT, messagesController.createMessage);
router.delete("/delete", authenticateJWT, messagesController.deleteMessage);
router.put("/edit", authenticateJWT, messagesController.editMessage);

module.exports = router;
