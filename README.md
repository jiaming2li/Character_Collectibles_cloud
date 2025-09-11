# IP Plush Hub - Full-Stack MERN Application

A comprehensive platform for IP plush enthusiasts to browse, collect, and share their love for Hello Kitty, Sanrio, Disney, Pokemon, and other beloved plush items.

## Features

### Core Functionality
- **Browse Plush Collection**: View all IP plush items with advanced filtering and search
- **User Collections**: Personal plush collections with social features
- **Wishlist Management**: Add/remove items from personal wishlists
- **Photo Sharing**: Users can upload and share photos of their plush items
- **Social Features**: Follow other users, like items, and leave reviews
- **User Profiles**: Comprehensive profiles with bio, collection stats, and activity

### Technical Features
- **JWT Authentication**: Secure role-based access control
- **Responsive Design**: Modern, mobile-first UI built with React
- **MongoDB Integration**: Efficient data management with Mongoose
- **File Upload**: Secure image upload for plush items and user profiles
- **Real-time Updates**: Live updates for likes, reviews, and collections
- **RESTful API**: Well-structured API endpoints with proper validation

## Architecture

### Backend (Node.js + Express)
- **Models**: User, Place (Plush), PlushPhoto, Message with comprehensive schemas
- **Controllers**: RESTful API endpoints for all CRUD operations
- **Middleware**: Authentication, file upload, validation, error handling
- **Routes**: Organized API routing with proper validation and authorization

### Frontend (React)
- **Components**: Modular, reusable UI components with CSS Modules
- **Hooks**: Custom hooks for HTTP requests, forms, and authentication
- **Context**: Global state management for user authentication
- **Routing**: React Router for seamless single-page navigation



## Cloud Deployment (Production)

### MongoDB Atlas Configuration

The application is configured to work with **MongoDB Atlas** for cloud database hosting:

1. **Front-end** 

   http://plushhub.s3-website-us-west-2.amazonaws.com

2. **Back-end**

   Contact me to start Amazon EC2 and access all functions by visiting the front-end website.

3. **Database Connection** 

   Database**: `plush-hub` on MongoDB Atlas

   


### Test Account

For testing the deployed application:
- **Email**: `test@test.com`
- **Password**: `password123`
- **Role**: Standard user with full access to features


