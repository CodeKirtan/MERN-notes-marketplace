const Note = require('../models/Note'); // Import the blueprint

// --- Logic for Searching Notes ---
const searchNotes = async (req, res) => {
    try {
        const { query } = req.query;
        let notes;
        
        if (query) {
            const searchRegex = new RegExp(query, 'i'); 
            notes = await Note.find({
                $or: [{ title: searchRegex }, { subject: searchRegex }]
            }).sort({ createdAt: -1 });
        } else {
            notes = await Note.find().sort({ createdAt: -1 });
        }
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during search' });
    }
};

// --- Logic for Uploading Notes ---
const uploadNote = async (req, res) => {
    try {
        const { title, subject } = req.body;
        const filePath = `/uploads/${req.file.filename}`;

        const newNote = new Note({ title, subject, filePath });
        const savedNote = await newNote.save();

        res.status(201).json(savedNote);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during upload' });
    }
};

module.exports = { searchNotes, uploadNote };