const Note = require('../models/Note'); // Import the blueprint
const crypto = require('crypto');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// --- Logic for Searching Notes ---
const searchNotes = async (req, res) => {
    try {
        const { query, branch, semester, sortBy, page = 1, limit = 10 } = req.query;
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

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        let notes;
        let total;

        if (sortBy === 'trending') {
            // Sliding Window: Only count visits in the last 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            const aggregationPipeline = [
                { $match: filter },
                { $addFields: {
                    recentVisitsFiltered: {
                        $filter: {
                            input: { $ifNull: ["$recentVisits", []] },
                            as: "visit",
                            cond: { $gte: ["$$visit", twentyFourHoursAgo] }
                        }
                    }
                }},
                { $addFields: { trendingScore: { $size: "$recentVisitsFiltered" } } },
                { $sort: { trendingScore: -1, createdAt: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
                { $project: { recentVisitsFiltered: 0, recentVisits: 0 } } // Clean up output
            ];
            
            notes = await Note.aggregate(aggregationPipeline);
            notes = await Note.populate(notes, { path: 'uploadedBy', select: 'name' });
            total = await Note.countDocuments(filter);
        } else {
            notes = await Note.find(filter)
                        .populate('uploadedBy', 'name')
                        .sort(sortOption)
                        .skip(skip)
                        .limit(limitNumber)
                        .lean();
            total = await Note.countDocuments(filter);
        }
        
        res.json({
            notes,
            currentPage: pageNumber,
            totalPages: Math.ceil(total / limitNumber),
            totalNotes: total
        });
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

        // 1. Calculate SHA-256 Hash of the file
        const fileBuffer = fs.readFileSync(req.file.path);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const fileHash = hashSum.digest('hex');

        // 2. Check for Duplicates in O(1) time
        const existingNote = await Note.findOne({ fileHash });
        if (existingNote) {
            fs.unlinkSync(req.file.path); // Delete local temp file
            return res.status(409).json({ 
                error: 'Duplicate file detected. This exact file already exists on our servers.',
                existingNoteId: existingNote._id
            });
        }

        // 3. Upload to Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
            folder: 'notes_hub_uploads',
            resource_type: 'auto'
        });
        const filePath = cloudinaryResult.secure_url; 
        
        // Clean up local temp file
        fs.unlinkSync(req.file.path);

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
            fileHash,
            branch,
            semester: Number(semester),
            tags: tagsArray,
            uploadedBy: req.user.id
        });

        const savedNote = await newNote.save();
        res.status(201).json(savedNote);
    } catch (err) {
        console.error(err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
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

        // Record visit for Trending Notes sliding window
        await Note.findByIdAndUpdate(id, {
            $push: { recentVisits: new Date() }
        });

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

// --- Logic for Adding Replies ---
const addReply = async (req, res) => {
    try {
        const { noteId, commentId } = req.params;
        const { text } = req.body;

        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const comment = note.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        comment.replies.push({ text, author: user.name, user: user._id });
        const savedNote = await note.save();

        res.status(201).json(savedNote);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error adding reply' });
    }
};

// --- Logic for Deleting Replies ---
const deleteReply = async (req, res) => {
    try {
        const { noteId, commentId, replyId } = req.params;

        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const comment = note.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const reply = comment.replies.id(replyId);
        if (!reply) {
            return res.status(404).json({ error: 'Reply not found' });
        }

        if (!reply.user || reply.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized: You can only delete your own replies' });
        }

        comment.replies.pull(replyId);

        const savedNote = await note.save();
        res.json(savedNote);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting reply' });
    }
};

// --- Delete Note ---
const deleteNote = async (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.user.id;

        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (note.uploadedBy.toString() !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this note' });
        }

        // Note: For a complete implementation, we should also delete the file from Cloudinary.
        // We'd need the public_id of the file to do this effectively.
        await Note.findByIdAndDelete(noteId);

        res.json({ message: 'Note deleted successfully', noteId });
    } catch (err) {
        console.error('Failed to delete note', err);
        res.status(500).json({ error: 'Server error deleting note' });
    }
};

module.exports = { searchNotes, uploadNote, upvoteNote, addComment, visitNote, deleteComment, addReply, deleteReply, deleteNote };