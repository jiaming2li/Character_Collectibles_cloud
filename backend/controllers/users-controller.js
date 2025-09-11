const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/user");
const Plush = require("../models/place");
const error = require("../models/http-error");

async function getUsers(req, res, next) {
  let users;

  try {
    users = await User.find({}, "-password");
  } catch (err) {
    return next(error("Couldn't retrieve users!", 500));
  }

  res
    .status(200)
    .json({ users: users.map((user) => user.toObject({ getters: true })) });
}

async function signup(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(error("Invalid information!", 422));
  }

  const { name, email, password } = req.body;
  let existingUser, hashedPassword, token;

  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(error("Couldn't create user! Please try again later.", 500));
  }

  if (existingUser) {
    return next(
      error("The provided email already belongs to an account.", 422)
    );
  }

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(error("Couldn't create user! Please try again later.", 500));
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.location,
    places: []
  });

  try {
    await createdUser.save();
  } catch (err) {
    return next(error("Couldn't create user! Please try again later.", 500));
  }

  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email
      },
      process.env.JWT_KEY,
      {
        expiresIn: "1h"
      }
    );
  } catch (err) {
    return next(error("Couldn't create user! Please try again later.", 500));
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token });
}

async function login(req, res, next) {
  const { email, password } = req.body;
  let existingUser,
    token,
    passwordsMatch = false;

  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(error("Couldn't query database!", 500));
  }

  if (!existingUser) {
    return next(error("Username or password is incorrect!", 403));
  }

  try {
    passwordsMatch = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(error("Couldn't log in! Please try again later.", 500));
  }

  if (!passwordsMatch) {
    return next(error("Username or password is incorrect!", 403));
  }

  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email
      },
      process.env.JWT_KEY,
      {
        expiresIn: "1h"
      }
    );
  } catch (err) {
    return next(error("Couldn't login! Please try again later.", 500));
  }

  res.status(200).json({
    message: "Logged user in!",
    userId: existingUser.id,
    email: existingUser.email,
    token
  });
}

async function getUserById(req, res, next) {
  const userId = req.params.userId;
  let user;

  try {
    // Check if userId is a valid MongoDB ObjectId
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return next(error("User not found!", 404));
    }
    
    user = await User.findById(userId, "-password");
  } catch (err) {
    return next(error("Couldn't retrieve user!", 500));
  }

  if (!user) {
    return next(error("User not found!", 404));
  }

  // 填充plushCollection数据
  let populatedUser = user.toObject({ getters: true });
  
  try {
    // 填充收藏的毛绒玩具
    if (user.plushCollection && user.plushCollection.length > 0) {
      const plushCollection = await Plush.find({
        _id: { $in: user.plushCollection }
      });
      populatedUser.plushCollection = plushCollection.map(plush => 
        plush.toObject({ getters: true })
      );
    } else {
      populatedUser.plushCollection = [];
    }

    // 填充愿望清单
    if (user.wishlist && user.wishlist.length > 0) {
      const wishlist = await Plush.find({
        _id: { $in: user.wishlist }
      });
      populatedUser.wishlist = wishlist.map(plush => 
        plush.toObject({ getters: true })
      );
    } else {
      populatedUser.wishlist = [];
    }

    // 填充收藏列表（likes/favorites）
    if (user.likes && user.likes.length > 0) {
      const likes = await Plush.find({
        _id: { $in: user.likes }
      });
      populatedUser.likes = likes.map(plush => 
        plush.toObject({ getters: true })
      );
    } else {
      populatedUser.likes = [];
    }

    // 填充自定义列表（如果有的话）
    if (user.customLists && user.customLists.length > 0) {
      // 需要填充每个自定义列表中的毛绒玩具数据
      const populatedCustomLists = await Promise.all(
        user.customLists.map(async (list) => {
          if (list.plushItems && list.plushItems.length > 0) {
            const plushItems = await Plush.find({
              _id: { $in: list.plushItems }
            });
            return {
              ...list.toObject({ getters: true }),
              plushItems: plushItems.map(plush => plush.toObject({ getters: true }))
            };
          } else {
            return {
              ...list.toObject({ getters: true }),
              plushItems: []
            };
          }
        })
      );
      populatedUser.customLists = populatedCustomLists;
    } else {
      populatedUser.customLists = [];
    }

    // 填充评论（如果有的话）
    if (user.reviews && user.reviews.length > 0) {
      populatedUser.reviews = user.reviews;
    } else {
      populatedUser.reviews = [];
    }

  } catch (err) {
    console.error("Error populating user data:", err);
    // 如果填充失败，至少返回基本用户信息
    populatedUser.plushCollection = [];
    populatedUser.wishlist = [];
    populatedUser.likes = [];
    populatedUser.customLists = [];
    populatedUser.reviews = [];
  }

  res.status(200).json({ user: populatedUser });
}

async function followUser(req, res, next) {
  const { userId } = req.params;
  const currentUserId = req.user.userId;

  if (userId === currentUserId) {
    return next(error("You cannot follow yourself!", 400));
  }

  let userToFollow, currentUser;

  try {
    userToFollow = await User.findById(userId);
    currentUser = await User.findById(currentUserId);
  } catch (err) {
    return next(error("Couldn't find user!", 500));
  }

  if (!userToFollow || !currentUser) {
    return next(error("User not found!", 404));
  }

  // Check if already following
  if (userToFollow.followers.includes(currentUserId)) {
    return next(error("Already following this user!", 400));
  }

  try {
    // Add to followers
    userToFollow.followers.push(currentUserId);
    await userToFollow.save();

    // Add to following
    currentUser.following.push(userId);
    await currentUser.save();
  } catch (err) {
    return next(error("Couldn't follow user!", 500));
  }

  res.status(200).json({ message: "Successfully followed user!" });
}

async function unfollowUser(req, res, next) {
  const { userId } = req.params;
  const currentUserId = req.user.userId;

  if (userId === currentUserId) {
    return next(error("You cannot unfollow yourself!", 400));
  }

  let userToUnfollow, currentUser;

  try {
    userToUnfollow = await User.findById(userId);
    currentUser = await User.findById(currentUserId);
  } catch (err) {
    return next(error("Couldn't find user!", 500));
  }

  if (!userToUnfollow || !currentUser) {
    return next(error("User not found!", 404));
  }

  // Check if not following
  if (!userToUnfollow.followers.includes(currentUserId)) {
    return next(error("Not following this user!", 400));
  }

  try {
    // Remove from followers
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUserId
    );
    await userToUnfollow.save();

    // Remove from following
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userId
    );
    await currentUser.save();
  } catch (err) {
    return next(error("Couldn't unfollow user!", 500));
  }

  res.status(200).json({ message: "Successfully unfollowed user!" });
}

async function addToOwned(req, res, next) {
  const { userId, plushId } = req.params;
  const currentUserId = req.user.userId;

  if (userId !== currentUserId) {
    return next(error("You can only modify your own collection!", 403));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(error("User not found!", 404));
    }

    // Check if plush is already in owned collection
    if (user.plushCollection.includes(plushId)) {
      return next(error("Plush is already in owned collection!", 400));
    }

    // Add to owned collection
    user.plushCollection.push(plushId);
    await user.save();

    res.status(200).json({ message: "Plush added to owned collection!" });
  } catch (err) {
    return next(error("Couldn't add plush to owned collection!", 500));
  }
}

async function removeFromOwned(req, res, next) {
  const { userId, plushId } = req.params;
  const currentUserId = req.user.userId;

  if (userId !== currentUserId) {
    return next(error("You can only modify your own collection!", 403));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(error("User not found!", 404));
    }

    // Remove from owned collection
    user.plushCollection = user.plushCollection.filter(
      id => id.toString() !== plushId
    );
    await user.save();

    res.status(200).json({ message: "Plush removed from owned collection!" });
  } catch (err) {
    return next(error("Couldn't remove plush from owned collection!", 500));
  }
}

async function removeFromWishlist(req, res, next) {
  const { userId, plushId } = req.params;
  const currentUserId = req.user.userId;

  if (userId !== currentUserId) {
    return next(error("You can only modify your own wishlist!", 403));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(error("User not found!", 404));
    }

    // Remove from wishlist
    user.wishlist = user.wishlist.filter(
      id => id.toString() !== plushId
    );
    await user.save();

    res.status(200).json({ message: "Plush removed from wishlist!" });
  } catch (err) {
    return next(error("Couldn't remove plush from wishlist!", 500));
  }
}

async function removeFromFavorites(req, res, next) {
  const { userId, plushId } = req.params;
  const currentUserId = req.user.userId;

  if (userId !== currentUserId) {
    return next(error("You can only modify your own favorites!", 403));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(error("User not found!", 404));
    }

    // Remove from favorites
    user.likes = user.likes.filter(
      id => id.toString() !== plushId
    );
    await user.save();

    res.status(200).json({ message: "Plush removed from favorites!" });
  } catch (err) {
    return next(error("Couldn't remove plush from favorites!", 500));
  }
}

async function createCustomList(req, res, next) {
  const { userId } = req.params;
  const currentUserId = req.user.userId;
  const { name, plushId } = req.body;

  // Check authorization
  if (userId !== currentUserId) {
    return next(error("You can only create lists for yourself!", 403));
  }

  // Validate input
  if (!name || !name.trim()) {
    return next(error("List name is required!", 400));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(error("User not found!", 404));
    }

    // Initialize customLists if it doesn't exist
    if (!user.customLists) {
      user.customLists = [];
    }

    // Check if list name already exists
    const existingList = user.customLists.find(list => list.name === name.trim());
    if (existingList) {
      return next(error("A list with this name already exists!", 400));
    }

    // Create new custom list
    const newList = {
      name: name.trim(),
      plushItems: plushId ? [plushId] : [],
      createdAt: new Date()
    };

    user.customLists.push(newList);
    await user.save();

    res.status(201).json({ 
      message: "Custom list created successfully!",
      list: newList
    });
  } catch (err) {
    console.error("Error creating custom list:", err);
    return next(error("Couldn't create custom list!", 500));
  }
}

async function addToCustomList(req, res, next) {
  const { userId, listId } = req.params;
  const currentUserId = req.user.userId;
  const { plushId } = req.body;

  // Check authorization
  if (userId !== currentUserId) {
    return next(error("You can only modify your own lists!", 403));
  }

  // Validate input
  if (!plushId) {
    return next(error("Plush ID is required!", 400));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(error("User not found!", 404));
    }

    // Find the custom list
    const customList = user.customLists.id(listId);
    if (!customList) {
      return next(error("Custom list not found!", 404));
    }

    // Check if plush is already in the list
    if (customList.plushItems.includes(plushId)) {
      return next(error("Plush is already in this list!", 400));
    }

    // Add plush to the list
    customList.plushItems.push(plushId);
    await user.save();

    res.status(200).json({ 
      message: "Plush added to custom list successfully!",
      list: customList
    });
  } catch (err) {
    console.error("Error adding plush to custom list:", err);
    return next(error("Couldn't add plush to custom list!", 500));
  }
}

async function getProfile(req, res, next) {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId)
      .populate('plushCollection')
      .populate('wishlist')
      .populate('following')
      .populate('followers');
  } catch (err) {
    return next(error("Couldn't fetch user profile!", 500));
  }

  if (!user) {
    return next(error("User not found!", 404));
  }

  res.json({ user: user.toObject({ getters: true }) });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
exports.getUserById = getUserById;
exports.getProfile = getProfile;
exports.addToOwned = addToOwned;
exports.removeFromOwned = removeFromOwned;
exports.removeFromWishlist = removeFromWishlist;
exports.removeFromFavorites = removeFromFavorites;
exports.createCustomList = createCustomList;
exports.addToCustomList = addToCustomList;
