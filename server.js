require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const noteRoutes = require('./routes/noteRoutes'); // Import your traffic cop

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
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch((err) => console.error('❌ Database connection error:', err));

// Route Middleware
app.use('/api', noteRoutes); // Sends all /api requests to your routes file

app.listen(PORT, () => {
    console.log(`🚀 Server running cleanly on port ${PORT}`);
});