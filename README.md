# AI-Powered Collaborative Knowledge Hub

A full-stack MERN application that enables teams to create, manage, and search knowledge documents with AI-powered features using Google's Gemini AI.

## 🚀 Features

### Core Functionality
- **User Authentication**: Email/password login with JWT tokens
- **Role-based Access**: User and Admin roles with different permissions
- **Document Management**: Create, read, update, delete documents
- **Version Control**: Track document versions with history
- **Team Activity Feed**: See recent team activities

### AI-Powered Features (Powered by Gemini)
- **Auto-Summarization**: Gemini AI generates concise summaries for documents automatically
- **Smart Tagging**: AI suggests relevant tags based on document content
- **Semantic Search**: AI-powered search that understands context and meaning
- **Q&A System**: Ask questions and get answers based on stored documents
- **AI Regeneration**: Regenerate summaries and tags with updated content

### User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional interface with Tailwind CSS
- **Real-time Updates**: Live activity feed and document updates
- **Tag Filtering**: Filter documents by tags with chip-style interface
- **Admin Dashboard**: Manage users and system access

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Google Gemini AI** for AI features
- **bcryptjs** for password hashing

### Frontend
- **React** with Vite build tool
- **React Router** for navigation
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Lucide React** for icons

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- Google AI Studio account (for Gemini API key)

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd project

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Environment Configuration

#### Server Environment
Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
GEMINI_API_KEY=your_google_generative_ai_api_key_here
```

**Get your Gemini API key from:** [Google AI Studio](https://makersuite.google.com/app/apikey)

#### Client Environment
Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Database Setup

The application will automatically create the necessary collections when you start using it. No manual database setup required.

### 4. Start the Application

```bash
# Start both frontend and backend concurrently
npm run dev
```

This will start:
- **Frontend** on http://localhost:3000
- **Backend** on http://localhost:5000

## 🔧 Manual Start (Alternative)

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

## 📚 How AI Features Work

### 1. Automatic Document Summarization
When creating/updating documents, Gemini AI automatically generates a 2-3 sentence summary that captures key points.

**Example:**
- **Input**: 3-page technical document about database sharding
- **AI Output**: "This document explains horizontal sharding in MongoDB, discusses pros/cons, and proposes using hash-based partitioning for scalability."

### 2. Intelligent Tag Generation
AI analyzes document content and generates relevant tags for easy categorization and discovery.

**Example:**
- **Input**: Document about "Authentication with JWT in Express apps"
- **AI Output**: Tags = ["Authentication", "JWT", "Express", "Node.js"]

### 3. Semantic Search
Unlike traditional keyword search, semantic search understands meaning and context.

**Example:**
- **User Query**: "split database horizontally"
- **Traditional Search**: No results (exact keyword match)
- **Semantic Search**: Finds "sharding" document (understands meaning)

### 4. AI Q&A System
Users can ask natural language questions about team knowledge.

**Example:**
- **Question**: "Who is responsible for the payment system?"
- **AI Answer**: "The payment system is assigned to Rahul and the backend team." (based on stored documents)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/users` - Get all users (admin only)
- `DELETE /api/auth/users/:id` - Delete user (admin only)

### Documents
- `GET /api/documents` - Get all documents (with search/filter)
- `POST /api/documents` - Create new document
- `GET /api/documents/:id` - Get single document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/semantic-search` - AI semantic search
- `POST /api/documents/ask` - AI Q&A
- `POST /api/documents/:id/summarize` - Regenerate summary with AI
- `POST /api/documents/:id/generate-tags` - Regenerate tags with AI

### Activity
- `GET /api/activity/recent` - Get recent team activities

## 👥 User Roles

### User
- Create, edit, and delete their own documents
- View all team documents
- Use AI features on their documents
- Search and ask questions

### Admin
- All user permissions
- Edit and delete any document
- Use AI features on any document
- Full access to all content
- **Manage users** (view, delete)
- **Access admin dashboard**

## 🏗️ Project Structure

```
├── server/                 # Backend application
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   ├── services/          # Gemini AI service
│   └── server.js          # Main server file
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
└── package.json           # Dependencies and scripts
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection

## 🚀 Deployment

The application is ready for deployment to platforms like:

- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Heroku, Railway, or any Node.js hosting
- **Database**: MongoDB Atlas (already configured)

Make sure to update environment variables in your deployment platform.

## 🐛 Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure:
1. Server is running on port 5000
2. Client is running on port 3000
3. CORS configuration in server.js is correct

### MongoDB Connection Issues
1. Check your MongoDB URI format
2. Ensure network access is configured in MongoDB Atlas
3. Verify username/password are correct
4. Check if your IP is whitelisted

### Gemini AI Not Working
1. Verify GEMINI_API_KEY is set correctly
2. Check if the API key has proper permissions
3. Ensure you have credits/quota in Google AI Studio

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Check console logs for error messages
4. Ensure all dependencies are installed

---

**Built with ❤️ using MERN stack and Google Gemini AI**