const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const plushPhotoSchema = new Schema({
  plushId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Plush"
  },
  uploader: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User"
  },
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  likes: [{
    type: mongoose.Types.ObjectId,
    ref: "User"
  }]
}, {
  timestamps: true
});

// 创建复合索引以提高查询效率
plushPhotoSchema.index({ plushId: 1, uploader: 1 });
plushPhotoSchema.index({ plushId: 1, uploadDate: -1 });

module.exports = mongoose.model("PlushPhoto", plushPhotoSchema);
