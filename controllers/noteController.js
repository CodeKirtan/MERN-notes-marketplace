const Note = require('../models/Note'); // Import the blueprint

// --- Logic for Searching Notes ---
const searchNotes = async (req, res) => {
    try {
        const { query, branch, semester, sortBy } = req.query;
        let filter = {};
        
        if (query) {
            filter.$text = { $search: query };
        }
        
        if (branch) {
            filter.branch = branch;
        }
        
        if (semester) {
            filter.semester = Number(semester);
        }

        let sortOption = { createdAt: -1 };
        if (sortBy === 'popular') {
            sortOption = { upvotes: -1, createdAt: -1 };
        } else if (sortBy === 'oldest') {
            sortOption = { createdAt: 1 };
        }
        
        const notes = await Note.find(filter).sort(sortOption);
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during search' });
    }
};

// --- Logic for Uploading Notes ---
const uploadNote = async (req, res) => {
    try {
        const { title, subject, branch, semester, tags } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Missing uploaded file' });
        }
        
        const filePath = `/uploads/${req.file.filename}`;

        let tagsArray = [];
        if (tags) {
            if (Array.isArray(tags)) {
                tagsArray = tags;
            } else if (typeof tags === 'string') {
                tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
            }
        }

        const newNote = new Note({ 
            title, 
            subject, 
            filePath, 
            branch, 
            semester: Number(semester),
            tags: tagsArray,
            uploadedBy: req.user.id
        });
        
        const savedNote = await newNote.save();
        res.status(201).json(savedNote);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during upload' });
    }
};

// --- Logic for Upvoting Notes ---
const upvoteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'upvote' or 'downvote'
        
        let incValue = 1;
        if (action === 'downvote') {
            incValue = -1;
        }
        
        const updatedNote = await Note.findByIdAndUpdate(
            id,
            { $inc: { upvotes: incValue } },
            { returnDocument: 'after' }
        );
        
        if (!updatedNote) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        res.json(updatedNote);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during upvote' });
    }
};

// --- Logic for Adding Comments ---
const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, author } = req.body;
        
        const note = await Note.findById(id);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        note.comments.push({ text, author: author || 'Anonymous' });
        const savedNote = await note.save();
        
        res.status(201).json(savedNote);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error adding comment' });
    }
};

// --- Logic for Recording Note Visits ---
const visitNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const User = require('../models/User');

        // Remove from list if already exists, to push it to the top
        await User.findByIdAndUpdate(userId, {
            $pull: { recentlyVisited: id }
        });

        const updatedUser = await User.findByIdAndUpdate(userId, {
            $push: {
                recentlyVisited: {
                    $each: [id],
                    $position: 0,
                    $slice: 5
                }
            }
        }, { returnDocument: 'after' });

        res.json({ success: true, recentlyVisited: updatedUser.recentlyVisited });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error registering note visit' });
    }
};

module.exports = { searchNotes, uploadNote, upvoteNote, addComment, visitNote };