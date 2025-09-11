const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User"
  },
  recipient: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User"
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Message", messageSchema);
