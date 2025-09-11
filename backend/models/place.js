const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const plushSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Hello Kitty', 'Sanrio', 'Disney', 'Pokemon', 'Other']
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  image: {
    type: String,
    required: true
  },
  additionalPhotos: [{
    type: String
  }],
  creator: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User"
  },
  likes: [{
    type: mongoose.Types.ObjectId,
    ref: "User"
  }],
  reviews: [{
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User"
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("Plush", plushSchema);
