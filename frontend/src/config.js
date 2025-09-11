// API endpoints
export const ENDPOINTS = {
  USERS: '/api/users',
  PLUSH: '/api/places',
  AVAILABLE_PLUSH: '/api/places/available', // Get plush not in user's collection
  AUTH: '/api/users',
  MESSAGES: '/api/messages',
  PROFILE: '/api/users/profile',
  PLUSH_PHOTOS: '/api/plush-photos'
};

// Asset base URL for images - using S3 REST API endpoint
export const ASSET_BASE_URL = 'https://plushphoto.s3.us-west-2.amazonaws.com';

// API base URL - 支持环境变量，默认为云端地址
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://my-env.eba-nprr6sqk.us-west-2.elasticbeanstalk.com'
// 常见的云端部署地址示例：
// AWS EC2: http://your-ec2-ip:5000
// Heroku: https://your-app-name.herokuapp.com
// Vercel: https://your-app-name.vercel.app
// Railway: https://your-app-name.railway.app
// DigitalOcean: http://your-droplet-ip:5000
