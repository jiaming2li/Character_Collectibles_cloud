const express = require("express");
const { check } = require("express-validator");

const placesController = require("../controllers/places-controller");
const s3Upload = require("../middleware/s3-upload");
const isAuth = require("../middleware/auth");

const router = express.Router();//在 Express 里创建一个迷你路由器对象，类似express()

// public routes
router.get("/", placesController.getAllPlush);
router.get("/available", placesController.getAvailablePlush); // 获取不在库中的plush
router.get("/:placeId", placesController.getPlushById);
router.get("/user/:userId", placesController.getPlushByUserId);

// auth middleware
router.use(isAuth);

// protected routes
router.post(
  "/",
  s3Upload.single("image"),
  [
    check("name").not().isEmpty(),
    check("brand").not().isEmpty(),
    check("category").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("price").isFloat({ min: 0 })
  ],
  placesController.createPlush
);
router.patch(
  "/:placeId",
  [check("name").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesController.updatePlushById
);
router.delete("/:placeId", placesController.deletePlushById);

// Review routes
router.post(
  "/:placeId/reviews",
  [
    check("rating").isInt({ min: 1, max: 5 }),
    check("comment").isLength({ min: 1, max: 500 })
  ],
  placesController.addReview
);

// Like routes
router.post("/:placeId/like", placesController.likePlush);
router.delete("/:placeId/like", placesController.likePlush);

// Wishlist routes
router.post("/:placeId/wishlist", placesController.addToWishlist);

// Favorites routes
router.post("/:placeId/favorites", placesController.addToFavorites);

module.exports = router;
