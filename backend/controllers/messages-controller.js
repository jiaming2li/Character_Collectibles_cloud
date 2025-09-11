const { validationResult } = require("express-validator");
require("dotenv").config();

const Message = require("../models/message");
const User = require("../models/user");
const error = require("../models/http-error");

async function sendMessage(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(error("Invalid message data!", 422));
  }

  const { recipientId, content } = req.body;
  const senderId = req.user.userId;

  if (senderId === recipientId) {
    return next(error("You cannot send a message to yourself!", 400));
  }

  let recipient;

  try {
    recipient = await User.findById(recipientId);
  } catch (err) {
    return next(error("Couldn't find recipient!", 500));
  }

  if (!recipient) {
    return next(error("Recipient not found!", 404));
  }

  const createdMessage = new Message({
    sender: senderId,
    recipient: recipientId,
    content
  });

  try {
    await createdMessage.save();
  } catch (err) {
    return next(error("Couldn't send message!", 500));
  }

  res.status(201).json({ 
    message: "Message sent successfully!",
    messageId: createdMessage.id 
  });
}

async function getMessages(req, res, next) {
  const userId = req.user.userId;

  let messages;

  try {
    messages = await Message.find({
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    })
    .populate("sender", "name image")
    .populate("recipient", "name image")
    .sort({ createdAt: -1 });
  } catch (err) {
    return next(error("Couldn't retrieve messages!", 500));
  }

  res.status(200).json({ 
    messages: messages.map(message => message.toObject({ getters: true }))
  });
}

async function getMessageById(req, res, next) {
  const messageId = req.params.messageId;
  const userId = req.user.userId;

  let message;

  try {
    message = await Message.findById(messageId)
      .populate("sender", "name image")
      .populate("recipient", "name image");
  } catch (err) {
    return next(error("Couldn't retrieve message!", 500));
  }

  if (!message) {
    return next(error("Message not found!", 404));
  }

  // Check if user is sender or recipient
  if (message.sender.id !== userId && message.recipient.id !== userId) {
    return next(error("Not authorized to view this message!", 403));
  }

  res.status(200).json({ 
    message: message.toObject({ getters: true })
  });
}

async function deleteMessage(req, res, next) {
  const messageId = req.params.messageId;
  const userId = req.user.userId;

  let message;

  try {
    message = await Message.findById(messageId);
  } catch (err) {
    return next(error("Couldn't find message!", 500));
  }

  if (!message) {
    return next(error("Message not found!", 404));
  }

  // Only sender can delete the message
  if (message.sender.toString() !== userId) {
    return next(error("Not authorized to delete this message!", 403));
  }

  try {
    await Message.findByIdAndDelete(messageId);
  } catch (err) {
    return next(error("Couldn't delete message!", 500));
  }

  res.status(200).json({ message: "Message deleted successfully!" });
}

exports.sendMessage = sendMessage;
exports.getMessages = getMessages;
exports.getMessageById = getMessageById;
exports.deleteMessage = deleteMessage;
