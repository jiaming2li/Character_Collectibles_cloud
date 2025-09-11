const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "your-access-key",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "your-secret-key",
  region: process.env.AWS_REGION || "us-west-2"
});

const s3 = new AWS.S3();

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const s3Upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "plushphoto",
    // 移除 acl 设置，因为存储桶禁用了 ACL
    key: function (req, file, cb) {
      const fileExtension = MIME_TYPE_MAP[file.mimetype];
      const fileName = `${uuidv4()}.${fileExtension}`;
      cb(null, fileName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
  fileFilter: (req, file, callback) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error("Invalid mimetype!");
    callback(error, isValid);
  },
  limits: {
    fileSize: 500000, // 500KB limit
  },
});

module.exports = s3Upload;
