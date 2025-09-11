const fs = require("fs");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const AWS = require("aws-sdk");

const PlushPhoto = require("../models/plush-photo");
const Plush = require("../models/place");
const User = require("../models/user");
const error = require("../models/http-error");

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "your-access-key",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "your-secret-key",
  region: process.env.AWS_REGION || "us-west-2"
});

const s3 = new AWS.S3();

// 获取某个plush的所有用户上传的图片
async function getPlushPhotos(req, res, next) {
  const { plushId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    // 验证plush是否存在
    const plush = await Plush.findById(plushId);
    if (!plush) {
      return next(error("找不到指定的plush！", 404));
    }

    const photos = await PlushPhoto.find({ plushId })
      .populate('uploader', 'name image email')
      .sort({ uploadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalPhotos = await PlushPhoto.countDocuments({ plushId });

    res.json({
      photos: photos.map(photo => photo.toObject({ getters: true })),
      totalPhotos,
      currentPage: page,
      totalPages: Math.ceil(totalPhotos / limit)
    });
  } catch (err) {
    console.error('Error fetching plush photos:', err);
    return next(error("获取图片失败！", 500));
  }
}

// 获取特定用户为某个plush上传的图片
async function getUserPlushPhotos(req, res, next) {
  const { plushId, userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    // 验证plush是否存在
    const plush = await Plush.findById(plushId);
    if (!plush) {
      return next(error("找不到指定的plush！", 404));
    }

    // 验证用户是否存在
    const user = await User.findById(userId);
    if (!user) {
      return next(error("找不到指定的用户！", 404));
    }

    const photos = await PlushPhoto.find({ plushId, uploader: userId })
      .populate('uploader', 'name image email')
      .sort({ uploadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalPhotos = await PlushPhoto.countDocuments({ plushId, uploader: userId });

    res.json({
      photos: photos.map(photo => photo.toObject({ getters: true })),
      totalPhotos,
      currentPage: page,
      totalPages: Math.ceil(totalPhotos / limit)
    });
  } catch (err) {
    console.error('Error fetching user plush photos:', err);
    return next(error("获取用户图片失败！", 500));
  }
}

// 用户上传图片到plush
async function uploadPlushPhoto(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(error("输入信息无效！", 422));
  }

  const { plushId } = req.params;
  const { description } = req.body;

  if (!req.file) {
    return next(error("请选择要上传的图片！", 400));
  }

  try {
    // 验证plush是否存在
    const plush = await Plush.findById(plushId);
    if (!plush) {
      return next(error("找不到指定的plush！", 404));
    }

    // 验证用户是否存在
    const user = await User.findById(req.user.userId);
    if (!user) {
      return next(error("用户不存在！", 404));
    }

    const newPhoto = new PlushPhoto({
      plushId,
      uploader: req.user.userId,
      imageUrl: req.file.location, // S3 URL
      description: description || ""
    });

    await newPhoto.save();

    // 填充uploader信息后返回
    await newPhoto.populate('uploader', 'name image email');

    res.status(201).json({
      photo: newPhoto.toObject({ getters: true }),
      message: "图片上传成功！"
    });

  } catch (err) {
    console.error('Error uploading photo:', err);
    // 如果保存失败，删除已上传到S3的文件
    if (req.file && req.file.key) {
      const deleteParams = {
        Bucket: "plushhub",
        Key: req.file.key
      };
      s3.deleteObject(deleteParams, (deleteErr) => {
        if (deleteErr) {
          console.error('Error deleting file from S3:', deleteErr);
        }
      });
    }
    return next(error("图片上传失败！", 500));
  }
}

// 删除用户上传的图片
async function deletePlushPhoto(req, res, next) {
  const { photoId } = req.params;

  try {
    const photo = await PlushPhoto.findById(photoId);

    if (!photo) {
      return next(error("找不到指定的图片！", 404));
    }

    // 检查是否是图片的上传者或管理员
    if (photo.uploader.toString() !== req.user.userId) {
      // 这里可以添加管理员权限检查
      const user = await User.findById(req.user.userId);
      if (!user || user.role !== 'admin') {
        return next(error("您没有权限删除这张图片！", 403));
      }
    }

    // 删除S3文件
    if (photo.imageUrl) {
      // 从S3 URL中提取key
      const urlParts = photo.imageUrl.split('/');
      const key = urlParts[urlParts.length - 1];
      
      const deleteParams = {
        Bucket: "plushhub",
        Key: key
      };
      
      s3.deleteObject(deleteParams, (err) => {
        if (err) {
          console.error('Error deleting file from S3:', err);
        }
      });
    }

    await PlushPhoto.findByIdAndDelete(photoId);

    res.json({ message: "图片删除成功！" });

  } catch (err) {
    console.error('Error deleting photo:', err);
    return next(error("删除图片失败！", 500));
  }
}

// 点赞/取消点赞图片
async function togglePhotoLike(req, res, next) {
  const { photoId } = req.params;

  try {
    const photo = await PlushPhoto.findById(photoId);

    if (!photo) {
      return next(error("找不到指定的图片！", 404));
    }

    const userId = req.user.userId;
    const isLiked = photo.likes.includes(userId);

    if (isLiked) {
      // 取消点赞
      photo.likes.pull(userId);
    } else {
      // 点赞
      photo.likes.push(userId);
    }

    await photo.save();

    res.json({
      message: isLiked ? "取消点赞成功！" : "点赞成功！",
      isLiked: !isLiked,
      likesCount: photo.likes.length
    });

  } catch (err) {
    console.error('Error toggling photo like:', err);
    return next(error("操作失败！", 500));
  }
}

module.exports = {
  getPlushPhotos,
  getUserPlushPhotos,
  uploadPlushPhoto,
  deletePlushPhoto,
  togglePhotoLike
};
