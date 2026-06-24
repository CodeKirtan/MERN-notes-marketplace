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

        const filePath = req.file.path; // Cloudinary URL

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
        const userId = req.user.id;

        const note = await Note.findById(id);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const hasUpvoted = note.upvotedBy.includes(userId);

        if (hasUpvoted) {
            note.upvotedBy.pull(userId);
        } else {
            note.upvotedBy.push(userId);
        }

        const updatedNote = await note.save();
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
        const { text } = req.body;

        const note = await Note.findById(id);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        note.comments.push({ text, author: user.name, user: user._id });
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

// --- Logic for Deleting Comments ---
const deleteComment = async (req, res) => {
    try {
        const { noteId, commentId } = req.params;

        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const comment = note.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Enforce ownership: only the user who created the comment can delete it
        if (!comment.user || comment.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized: You can only delete your own comments' });
        }

        // Remove the comment
        note.comments.pull(commentId);

        const savedNote = await note.save();
        res.json(savedNote);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting comment' });
    }
};

module.exports = { searchNotes, uploadNote, upvoteNote, addComment, visitNote, deleteComment };