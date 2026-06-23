const User = require('../models/User');
const Note = require('../models/Note');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_notes_marketplace_secret_key_123';

// Enforce student/academic domains: ends with .edu or student.university.edu
const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.edu|student\.university\.edu)$/i;

// --- Register Student User ---
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Only student email addresses (ending in .edu) are allowed to access this marketplace.' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        // Sign Token
        const token = jwt.sign(
            { id: savedUser._id, email: savedUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

// --- Login User ---
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Sign Token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// --- Get Profile (Protected) ---
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate({
                path: 'recentlyVisited',
                select: 'title subject branch semester filePath tags upvotes'
            });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch notes uploaded by this user
        const uploadedNotes = await Note.find({ uploadedBy: req.user.id })
            .select('title subject branch semester filePath tags upvotes');

        res.json({
            user,
            uploadedNotes
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error retrieving profile' });
    }
};

module.exports = { registerUser, loginUser, getUserProfile };
