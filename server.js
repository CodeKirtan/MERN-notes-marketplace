require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
    process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const noteRoutes = require('./routes/noteRoutes'); // Import your traffic cop
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Only allow requests from our frontend
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Ensure uploads folder exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static('uploads'));

app.use(helmet()); // Secure HTTP headers for API routes
app.use(express.json());

// Connect Database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (err) {
        console.error('❌ MongoDB Atlas connection error:', err.message);
        console.log('🔌 Attempting local MongoDB fallback (mongodb://127.0.0.1:27017/notes_hub)...');
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/notes_hub');
            console.log('✅ Connected successfully to local MongoDB!');
        } catch (localErr) {
            console.error('❌ Local MongoDB fallback failed:', localErr.message);
            console.error('💡 Hint: Please whitelist your current IP address in MongoDB Atlas, or ensure MongoDB is running locally.');
        }
    }
};
connectDB();

// Rate Limiting

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // relaxed for development (was 10 per hour)
    message: { error: 'Too many authentication attempts, please try again later.' }
});

// Health Check Endpoint for UptimeRobot (prevents Render cold starts)
app.get('/api/health', (req, res) => res.status(200).send('OK'));

// Route Middleware
app.use('/api', noteRoutes); // Sends all /api requests to your routes file
app.use('/api/auth', authLimiter, authRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running cleanly on port ${PORT}`);
});