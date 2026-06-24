const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { searchNotes, uploadNote, upvoteNote, addComment, visitNote } = require('../controllers/noteController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadNoteSchema, searchNotesSchema, upvoteNoteSchema, addCommentSchema } = require('../validators/noteValidator');

// Multer Storage Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Map endpoints to controller functions
router.get('/search', validate(searchNotesSchema), searchNotes);
router.post('/upload', auth, upload.single('file'), validate(uploadNoteSchema), uploadNote);
router.post('/notes/:id/upvote', auth, validate(upvoteNoteSchema), upvoteNote);
router.post('/notes/:id/comments', auth, validate(addCommentSchema), addComment);
router.post('/notes/:id/visit', auth, visitNote);

module.exports = router;