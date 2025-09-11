const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  image: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  plushCollection: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Plush"
    }
  ],
  wishlist: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Plush"
    }
  ],
  customLists: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    plushItems: [{
      type: mongoose.Types.ObjectId,
      ref: "Plush"
    }],
    isPublic: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    type: mongoose.Types.ObjectId,
    ref: "User"
  }],
  following: [{
    type: mongoose.Types.ObjectId,
    ref: "User"
  }],
  reviews: [{
    plushItem: {
      type: mongoose.Types.ObjectId,
      ref: "Plush"
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Types.ObjectId,
    ref: "Plush"
  }]
}, {
  timestamps: true
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
