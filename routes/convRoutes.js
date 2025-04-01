const express = require("express");
const router = express.Router();
const convController = require("../controllers/conversationController");
const passport = require("passport");
const authenticateJWT = passport.authenticate("jwt", { session: false });

router.get("/", authenticateJWT, convController.fetchConv);
router.post("/new", authenticateJWT, convController.newConv);
router.post("/leave", authenticateJWT, convController.leaveConv);
router.put("/addParticipants", authenticateJWT, convController.addPart);
router.post("/remove", authenticateJWT, convController.removePart);
router.get("/:id", authenticateJWT, convController.fetchSingleConv);
router.put("/editName", authenticateJWT, convController.editConvName);

module.exports = router;
