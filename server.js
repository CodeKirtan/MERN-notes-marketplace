require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const noteRoutes = require('./routes/noteRoutes'); // Import your traffic cop
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static('uploads'));

// Connect Database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (err) {
        console.error('❌ MongoDB Atlas connection error:', err.message);
        console.log('🔌 Attempting local MongoDB fallback (mongodb://127.0.0.1:27017/notes_marketplace)...');
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/notes_marketplace');
            console.log('✅ Connected successfully to local MongoDB!');
        } catch (localErr) {
            console.error('❌ Local MongoDB fallback failed:', localErr.message);
            console.error('💡 Hint: Please whitelist your current IP address in MongoDB Atlas, or ensure MongoDB is running locally.');
        }
    }
};
connectDB();

// Route Middleware
app.use('/api', noteRoutes); // Sends all /api requests to your routes file
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running cleanly on port ${PORT}`);
});