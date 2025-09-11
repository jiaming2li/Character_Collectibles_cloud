const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controller");
const s3Upload = require("../middleware/s3-upload");
const checkAuth = require("../middleware/auth");

const router = express.Router();

router.get("/", usersController.getUsers);

router.get("/profile", checkAuth, usersController.getProfile);

router.post(
  "/signup",
  s3Upload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail({ gmail_remove_dots: false }).isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);
router.post("/login", usersController.login);

// Protected routes - require authentication
router.use(checkAuth);

router.get("/:userId", usersController.getUserById);

// Custom lists routes
router.post("/:userId/custom-lists", usersController.createCustomList);
router.post("/:userId/custom-lists/:listId/plush", usersController.addToCustomList);

// Add to collections
router.post("/:userId/plush-collection/:plushId", usersController.addToOwned);

// Remove from collections
router.delete("/:userId/plush-collection/:plushId", usersController.removeFromOwned);
router.delete("/:userId/wishlist/:plushId", usersController.removeFromWishlist);
router.delete("/:userId/favorites/:plushId", usersController.removeFromFavorites);

module.exports = router;
