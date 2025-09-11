const express = require("express");
const { check } = require("express-validator");

const plushPhotosController = require("../controllers/plush-photos-controller");
const s3Upload = require("../middleware/s3-upload");
const checkAuth = require("../middleware/auth");

const router = express.Router();

// 获取某个plush的所有用户上传的图片（无需认证）
router.get("/:plushId", plushPhotosController.getPlushPhotos);

// 获取特定用户为某个plush上传的图片（无需认证）
router.get("/:plushId/user/:userId", plushPhotosController.getUserPlushPhotos);

// 以下路由需要用户认证
router.use(checkAuth);

// 用户上传图片到plush
router.post(
  "/:plushId",
  s3Upload.single("image"),
  [
    check("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("描述不能超过500个字符")
  ],
  plushPhotosController.uploadPlushPhoto
);

// 删除用户上传的图片
router.delete("/:photoId", plushPhotosController.deletePlushPhoto);

// 点赞/取消点赞图片
router.post("/:photoId/like", plushPhotosController.togglePhotoLike);

module.exports = router;
