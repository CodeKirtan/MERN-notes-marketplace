const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const { searchNotes, uploadNote, upvoteNote, addComment, visitNote } = require('../controllers/noteController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadNoteSchema, searchNotesSchema, upvoteNoteSchema, addCommentSchema } = require('../validators/noteValidator');

// Cloudinary Storage Config
// Note: Cloudinary will automatically use process.env.CLOUDINARY_URL
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'notes_marketplace_uploads',
        resource_type: 'auto' // Important: allows PDFs and raw files, not just images
    }
});
const upload = multer({ storage: storage });

// Map endpoints to controller functions
router.get('/search', validate(searchNotesSchema), searchNotes);
router.post('/upload', auth, upload.single('file'), validate(uploadNoteSchema), uploadNote);
router.post('/notes/:id/upvote', auth, validate(upvoteNoteSchema), upvoteNote);
router.post('/notes/:id/comments', auth, validate(addCommentSchema), addComment);
router.post('/notes/:id/visit', auth, visitNote);

module.exports = router;