# Student Management System

A comprehensive, full-stack Student Management System built with React (Frontend) and Node.js/Express/MongoDB (Backend).

## Features

### User Roles
- **Admin**: Full system access, user management, timetable management, announcements
- **Teacher**: View and manage students, marks, timetables, create announcements
- **Student**: View personal timetable, marks, announcements, profile

### Core Functionality
- ✅ User Authentication (Login, Registration, Password Reset)
- ✅ Dashboard with role-based views
- ✅ Timetable Management (View/Edit by Admin)
- ✅ Marks/Results Management (View/Edit by Teachers/Admin)
- ✅ Announcements System (Role-based visibility)
- ✅ User Management (Admin only)
- ✅ Profile Management (Edit personal information)
- ✅ Professional, modern UI with responsive design

## Tech Stack

### Frontend
- React 19.1.1
- React Router DOM 7.9.1
- Vite 7.1.2
- Modern CSS with CSS Variables

### Backend
- Node.js
- Express 5.1.0
- MongoDB with Mongoose 8.19.3
- JWT Authentication
- bcryptjs for password hashing

## Project Structure

```
Student_Managment_System/
├── Client/                 # React Frontend
│   ├── src/
│   │   ├── Components/    # Reusable components
│   │   ├── Pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API service layer
│   │   └── ...
│   └── package.json
├── Server/                 # Node.js Backend
│   ├── config/            # Configuration files
│   ├── Controllers/       # Route controllers
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── index.js           # Server entry point
└── Assets/                # Static assets
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the Server directory:
```bash
cd Server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the Server directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/studentManagementSystem
JWT_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173
```

4. Start MongoDB (if running locally):
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

5. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the Client directory:
```bash
cd Client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the Client directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile (Protected)
- `PUT /api/auth/profile` - Update user profile (Protected)
- `PUT /api/auth/change-password` - Change password (Protected)

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Protected)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)

### Marks
- `GET /api/marks` - Get marks with filters (Protected)
- `GET /api/marks/student/:reg` - Get marks for a student (Protected)
- `POST /api/marks` - Create mark (Teacher/Admin only)
- `PUT /api/marks/:id` - Update mark (Teacher/Admin only)
- `DELETE /api/marks/:id` - Delete mark (Admin only)

### Announcements
- `GET /api/announcements` - Get announcements with filters (Protected)
- `POST /api/announcements` - Create announcement (Teacher/Admin only)
- `PUT /api/announcements/:id` - Update announcement (Teacher/Admin only)
- `DELETE /api/announcements/:id` - Delete announcement (Admin only)

### Timetable
- `GET /api/timetable` - Get all classes (Protected)
- `GET /api/timetable/:class` - Get timetable for a class (Protected)
- `PUT /api/timetable/:class` - Update timetable (Admin only)

## Default Login Credentials

You can create users through the registration endpoint or directly in MongoDB. For testing, you can use the DummyData.json file structure as a reference.

## Development Notes

### Current Status
- ✅ Backend API fully implemented
- ✅ Frontend API service layer created
- ✅ Login page updated to use API
- ⚠️ Other frontend components still use DummyData.json (can be updated to use API)
- ✅ Professional UI styling implemented
- ✅ Error handling and loading states added

### Migration from DummyData.json to API

The frontend currently has a fallback to DummyData.json. To fully migrate to the API:

1. Update each component to use the API service instead of importing DummyData.json
2. Replace direct data access with API calls
3. Add proper loading and error states
4. Update state management to handle async operations

Example migration:
```javascript
// Before
import db from '../../../Assets/DummyData.json';
const users = db.Users;

// After
import { usersAPI } from '../services/api';
const [users, setUsers] = useState([]);
useEffect(() => {
  usersAPI.getAll().then(res => setUsers(res.data));
}, []);
```

## Environment Variables

### Server (.env)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS

### Client (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the connection string in `.env`
- Verify network connectivity if using MongoDB Atlas

### CORS Errors
- Ensure `FRONTEND_URL` in server `.env` matches your frontend URL
- Check that CORS middleware is properly configured

### Authentication Issues
- Verify JWT_SECRET is set
- Check token expiration (default: 7 days)
- Ensure tokens are being stored in localStorage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on the repository.

