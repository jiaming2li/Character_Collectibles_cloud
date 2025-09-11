const fs = require("fs");

const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const Plush = require("../models/place");
const User = require("../models/user");
const HttpError = require("../models/http-error");

async function getPlushById(req, res, next) {
  const { placeId } = req.params;
  let plush;

  try {
    plush = await Plush.findById(placeId)
      .populate('creator', 'name image')
      .populate('reviews.user', 'name image');
  } catch (err) {
    return next(new HttpError("Couldn't find a plush for the given ID!", 404));
  }

  if (!plush) {
    return next(new HttpError("Couldn't find a plush for the given ID!", 404));
  }

  res.json({ plush: plush.toObject({ getters: true }) });
}

async function getAllPlush(req, res, next) {
  const { category, brand, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;
  
  console.log('getAllPlush called with:', { category, brand, sortBy, order, page, limit });
  console.log('Plush model name:', Plush.modelName);
  console.log('Plush collection name:', Plush.collection.name);
  
  let query = {};
  
  if (category) query.category = category;
  if (brand) query.brand = brand;
  
  console.log('Query:', query);
  
  try {
    const plush = await Plush.find(query)
      .populate('creator', 'name image')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
      
    console.log('Found plush:', plush.length);
    if (plush.length > 0) {
      console.log('First plush:', plush[0].name);
    }
      
    const total = await Plush.countDocuments(query);
    console.log('Total count:', total);
    
    res.json({
      plush: plush.map(p => p.toObject({ getters: true })),
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    console.log('Error in getAllPlush:', err);
    return next(new HttpError("Couldn't fetch plush!", 500));
  }
}

// 获取不在任何用户库中的plush（用于首页显示）
async function getAvailablePlush(req, res, next) {
  const { category, brand, sortBy = 'createdAt', order = 'desc', page = 1, limit = 50 } = req.query;
  
  try {
    // 获取所有用户的plushCollection
    const users = await User.find({}, 'plushCollection');
    const collectedPlushIds = users.reduce((acc, user) => {
      return acc.concat(user.plushCollection);
    }, []);
    
    let query = {
      _id: { $nin: collectedPlushIds } // 不在任何用户库中的plush
    };
    
    if (category) query.category = category;
    if (brand) query.brand = brand;
    
    const plush = await Plush.find(query)
      .populate('creator', 'name image')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
      
    const total = await Plush.countDocuments(query);
    
    res.json({
      plush: plush.map(p => p.toObject({ getters: true })),
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    return next(new HttpError("Couldn't fetch available plush!", 500));
  }
}

async function getPlushByUserId(req, res, next) {
  const { userId } = req.params;
  let user;

  try {
    user = await User.findById(userId).populate("plushCollection");
  } catch (err) {
    return next(new HttpError("Couldn't fetch plush for the given user ID!", 404));
  }

  if (!user) {
    return next(new HttpError("Couldn't fetch plush for the given user ID!", 404));
  }

  res.json({
    plush: user.plushCollection.map((plush) => plush.toObject({ getters: true }))
  });
}

async function createPlush(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid information!", 422));
  }

  const { name, brand, category, description, price } = req.body;
  let user;

  const createdPlush = new Plush({
    name,
    brand,
    category,
    description,
    price: parseFloat(price),
    image: req.file.location,
    creator: req.user.userId
  });

  try {
    user = await User.findById(req.user.userId);
  } catch (err) {
    return next(new HttpError("Plush creation failed!", 500));
  }

  if (!user) {
    return next(new HttpError("Couldn't find user for provided ID!", 404));
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    await createdPlush.save({ session });

    user.plushCollection.push(createdPlush);
    await user.save({ session });

    await session.commitTransaction();
  } catch (err) {
    return next(new HttpError("Couldn't write data to database!", 500));
  }

  res.status(201).json({ plush: createdPlush });
}

async function updatePlushById(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid information!", 422));
  }

  const { placeId } = req.params;
  const { name, brand, category, description, price } = req.body;
  let plush;

  try {
    plush = await Plush.findById(placeId);
  } catch (err) {
    return next(new HttpError("Couldn't find plush!", 500));
  }

  if (plush.creator.toString() !== req.user.userId) {
    return next(new HttpError("You can't edit plush that don't belong to you!", 401));
  }

  plush.name = name;
  plush.brand = brand;
  plush.category = category;
  plush.description = description;
  plush.price = parseFloat(price);

  try {
    await plush.save();
  } catch (err) {
    return next(new HttpError(("Couldn't save plush!", 500)));
  }

  res.status(200).json({ plush: plush.toObject({ getters: true }) });
}

async function deletePlushById(req, res, next) {
  const { placeId } = req.params;
  let plush;

  try {
    plush = await Plush.findById(placeId).populate("creator");
  } catch (err) {
    return next(new HttpError(("Couldn't find plush for the given ID!", 500)));
  }

  if (!plush) {
    return next(new HttpError(("Couldn't find plush for the given ID!", 500)));
  }

  if (plush.creator.id !== req.user.userId) {
    return next(
      error("You can't delete plush that don't belong to you!", 401)
    );
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    await plush.deleteOne({ session });

    plush.creator.plushCollection.pull(plush);
    await plush.creator.save({ session });

    await session.commitTransaction();
  } catch (err) {
    return next(new HttpError(("Couldn't remove plush!", 500)));
  }

  fs.unlink(plush.image, (error) => console.log(error));

  res.status(200).json({ message: "Deleted plush!" });
}

async function likePlush(req, res, next) {
  const { placeId } = req.params;
  let plush;

  try {
    plush = await Plush.findById(placeId);
  } catch (err) {
    return next(new HttpError("Couldn't find plush!", 500));
  }

  if (!plush) {
    return next(new HttpError("Couldn't find plush!", 404));
  }

  const likeIndex = plush.likes.indexOf(req.user.userId);
  
  if (likeIndex > -1) {
    plush.likes.splice(likeIndex, 1);
  } else {
    plush.likes.push(req.user.userId);
  }

  try {
    await plush.save();
  } catch (err) {
    return next(new HttpError("Couldn't update like!", 500));
  }

  res.json({ 
    plush: plush.toObject({ getters: true }),
    isLiked: likeIndex === -1
  });
}

async function addReview(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid review data!", 422));
  }

  const { placeId } = req.params;
  const { rating, comment } = req.body;
  let plush;

  try {
    plush = await Plush.findById(placeId);
  } catch (err) {
    return next(new HttpError("Couldn't find plush!", 500));
  }

  if (!plush) {
    return next(new HttpError("Couldn't find plush!", 404));
  }

  // Check if user already reviewed
  const existingReviewIndex = plush.reviews.findIndex(
    review => review.user.toString() === req.user.userId
  );

  const review = {
    user: req.user.userId,
    rating: parseInt(rating),
    comment
  };

  if (existingReviewIndex > -1) {
    plush.reviews[existingReviewIndex] = review;
  } else {
    plush.reviews.push(review);
  }

  // Calculate average rating
  const totalRating = plush.reviews.reduce((sum, review) => sum + review.rating, 0);
  plush.rating = totalRating / plush.reviews.length;

  try {
    await plush.save();
  } catch (err) {
    return next(new HttpError("Couldn't save review!", 500));
  }

  res.json({ plush: plush.toObject({ getters: true }) });
}

async function addToWishlist(req, res, next) {
  const { placeId } = req.params;
  let user;

  try {
    user = await User.findById(req.user.userId);
  } catch (err) {
    return next(new HttpError("Couldn't find user!", 500));
  }

  if (!user) {
    return next(new HttpError("Couldn't find user!", 404));
  }

  // Check if plush is already in wishlist
  const wishlistIndex = user.wishlist.indexOf(placeId);
  
  if (wishlistIndex > -1) {
    return next(new HttpError("Plush is already in wishlist!", 400));
  }

  user.wishlist.push(placeId);

  try {
    await user.save();
  } catch (err) {
    return next(new HttpError("Couldn't add to wishlist!", 500));
  }

  res.json({ message: "Added to wishlist!" });
}

async function addToFavorites(req, res, next) {
  const { placeId } = req.params;
  let user;

  try {
    user = await User.findById(req.user.userId);
  } catch (err) {
    return next(new HttpError("Couldn't find user!", 500));
  }

  if (!user) {
    return next(new HttpError("Couldn't find user!", 404));
  }

  // Check if plush is already in favorites
  const favoritesIndex = user.likes.indexOf(placeId);
  
  if (favoritesIndex > -1) {
    return next(new HttpError("Plush is already in favorites!", 400));
  }

  user.likes.push(placeId);

  try {
    await user.save();
  } catch (err) {
    return next(new HttpError("Couldn't add to favorites!", 500));
  }

  res.json({ message: "Added to favorites!" });
}

exports.getPlushById = getPlushById;
exports.getAllPlush = getAllPlush;
exports.getAvailablePlush = getAvailablePlush;
exports.getPlushByUserId = getPlushByUserId;
exports.createPlush = createPlush;
exports.updatePlushById = updatePlushById;
exports.deletePlushById = deletePlushById;
exports.likePlush = likePlush;
exports.addReview = addReview;
exports.addToWishlist = addToWishlist;
exports.addToFavorites = addToFavorites;
