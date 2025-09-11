const express = require("express");
const { check } = require("express-validator");

const messagesController = require("../controllers/messages-controller");
const checkAuth = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(checkAuth);

router.post(
  "/",
  [
    check("recipientId").not().isEmpty(),
    check("content").not().isEmpty().isLength({ min: 1, max: 1000 })
  ],
  messagesController.sendMessage
);

router.get("/", messagesController.getMessages);
router.get("/:messageId", messagesController.getMessageById);
router.delete("/:messageId", messagesController.deleteMessage);

module.exports = router;
