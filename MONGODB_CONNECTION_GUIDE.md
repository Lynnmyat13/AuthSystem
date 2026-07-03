# MongoDB Connection Troubleshooting Guide

## Current Issue
You're experiencing MongoDB connection timeouts with the error:
```
Operation `users.findOne()` buffering timed out after 10000ms
MongoDB connection error Error: queryTxt ETIMEOUT authentication-system.lnqt3vc.mongodb.net
```

## Quick Fixes

### 1. Create Environment File
Create a `.env` file in the `backend` directory with your MongoDB connection string:

```env
# MongoDB Atlas Connection
MONGODB_URL=mongodb+srv://username:password@authentication-system.lnqt3vc.mongodb.net/authentication_db?retryWrites=true&w=majority

# Server Configuration
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-here
```

### 2. For Local Development (Recommended)
If you want to use a local MongoDB instance instead of Atlas:

```env
MONGODB_URL=mongodb://127.0.0.1:27017/authentication_db
```

## MongoDB Atlas Setup

### 1. Get Your Connection String
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `authentication_db`

### 2. Network Access
1. In MongoDB Atlas, go to "Network Access"
2. Add your current IP address (or use 0.0.0.0/0 for all IPs - less secure)
3. Make sure your IP is whitelisted

### 3. Database User
1. Go to "Database Access"
2. Create a user with read/write permissions
3. Use these credentials in your connection string

## Local MongoDB Setup (Alternative)

### Install MongoDB Locally
```bash
# Windows (using Chocolatey)
choco install mongodb

# Or download from https://www.mongodb.com/try/download/community
```

### Start MongoDB Service
```bash
# Windows
net start MongoDB

# Or start manually
mongod --dbpath C:\data\db
```

## Testing Your Connection

### 1. Test with MongoDB Compass
- Download [MongoDB Compass](https://www.mongodb.com/products/compass)
- Try connecting with your connection string
- This will help identify if the issue is with your connection string or the application

### 2. Test with Node.js
Create a test file `test-connection.js`:

```javascript
const mongoose = require('mongoose');

const testConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connection successful!');
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
};

testConnection();
```

## Common Issues and Solutions

### 1. DNS Resolution Issues
- **Problem**: `queryTxt ETIMEOUT` error
- **Solution**: 
  - Check your internet connection
  - Try using a different DNS server (8.8.8.8, 1.1.1.1)
  - Restart your router

### 2. Firewall Issues
- **Problem**: Connection blocked by firewall
- **Solution**: 
  - Allow MongoDB ports (27017 for local, 27017 for Atlas)
  - Check Windows Firewall settings
  - Try disabling antivirus temporarily

### 3. IP Whitelist Issues
- **Problem**: IP not whitelisted in MongoDB Atlas
- **Solution**: 
  - Add your current IP to MongoDB Atlas Network Access
  - Use 0.0.0.0/0 for all IPs (less secure but works for development)

### 4. Connection String Issues
- **Problem**: Wrong credentials or malformed URL
- **Solution**: 
  - Double-check username and password
  - Ensure special characters are URL-encoded
  - Verify the cluster name is correct

## Updated Connection Configuration

The database connection has been updated with:
- Increased timeout settings (30 seconds)
- Disabled mongoose buffering
- Better error handling
- Connection event listeners
- Graceful shutdown handling

## Next Steps

1. **Create the `.env` file** with your MongoDB connection string
2. **Test the connection** by running the server
3. **If using Atlas**, ensure your IP is whitelisted
4. **If issues persist**, try using local MongoDB for development

## Running the Application

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The server will now provide better error messages and troubleshooting tips if the connection fails.
