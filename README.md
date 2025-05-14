# MSN_back

<div align="center">
  <img src="https://i.postimg.cc/CMb0Y163/MSN.jpg" width="500" alt="MSN Clone Logo">
  <h3>Backend server for the MSN Messenger application</h3>
</div>

## 📋 Overview

MSN_back is the backend server for the MSN Messenger  application. It provides RESTful API endpoints for user authentication, conversation management, messaging, file sharing, and user management.

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Passport** - Authentication middleware
- **CORS** - Cross-Origin Resource Sharing
- **Dotenv** - Environment variable management
- **PostgreSQL** - Database

## 📊 API Endpoints

| Route | Description |
|-------|-------------|
| `/auth` | Authentication routes (login, register, etc.) |
| `/conv` | Conversation management routes |
| `/messages` | Message handling routes |
| `/files` | File upload and management routes |
| `/users` | User profile and management routes |

## 📦 Installation

### Prerequisites
- Node.js (v14.x or higher)
- npm or yarn
- MongoDB instance (local or remote)

### Setup

1. Clone the repository
```bash
git clone https://github.com/Giolii/MSN_back.git
cd MSN_back
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create environment variables
```bash
# Create a .env file in the root directory
touch .env
```

Add the following environment variables to the .env file:
```
PORT
DATABASE_URL
JWT_SECRET
NODE_ENV=production

VITE_FRONTEND_URL
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. The server will start on the specified port (default: 8000)

## 🔐 Authentication

Authentication is implemented using Passport.js with JWT strategy:

- `/auth/register` - Create a new user account
- `/auth/login` - Authenticate and receive a JWT token
- Protected routes require a valid JWT token in the Authorization header

## 🗄️ Data Models

The application likely uses the following data models (based on routes):

- **User** - User account information
- **Conversation** - Chat conversation data
- **Message** - Individual messages within conversations
- **File** - Uploaded files metadata


## 🔄 Connection with Frontend

This backend works in conjunction with [MSN_front](https://github.com/Giolii/MSN_front), which handles the user interface and client-side logic.

## 🚀 Deployment

### Production Build
```bash
npm run build
# or
yarn build
```

### Starting in Production
```bash
npm start
# or
yarn start
```

### Deployment platforms
The backend can be deployed on various platforms including:
- Heroku
- Railway
- Render
- AWS Elastic Beanstalk
- Digital Ocean
- Docker containers

Thank you!
