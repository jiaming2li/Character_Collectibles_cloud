const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");


// Set JWT_KEY if not present
if (!process.env.JWT_KEY) {
  process.env.JWT_KEY = "your-super-secret-jwt-key-here-12345";
}

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const messagesRoutes = require("./routes/messages-routes");
const plushPhotosRoutes = require("./routes/plush-photos-routes");
const HttpError = require("./models/http-error");

const app = express(); //创建一个 Express 应用实例的代码

  app.use(bodyParser.json());
  // Static files are now served from S3, no local uploads needed

//中间件是处理请求和响应的函数
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/api/places", placesRoutes);//app.use() 给 placesRoutes 里所有路由加了一个公共前缀
app.use("/api/users", usersRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/plush-photos", plushPhotosRoutes);

// React app is served from S3, backend only handles API routes

app.use((req, res, next) => {
  throw new HttpError("Couldn't find route!", 404);
});

app.use((error, req, res, next) => {
  // S3 files don't need local cleanup
  if (req.file && req.file.path && !req.file.location) {
    fs.unlink(req.file.path, (error) => console.log(error));
  }

  if (res.headerSent) {
    return next(error);
  }

  res
    .status(error.code || 500)
    .json({ message: error.message || "An error occurred!" });
});

// 使用云端MongoDB Atlas数据库连接
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is required for cloud database connection");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB successfully!");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
    process.exit(1);
  });
