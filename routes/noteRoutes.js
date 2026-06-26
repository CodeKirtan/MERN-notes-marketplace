const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { searchNotes, uploadNote, upvoteNote, addComment, visitNote, deleteComment, addReply, deleteReply } = require('../controllers/noteController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadNoteSchema, searchNotesSchema, upvoteNoteSchema, addCommentSchema, deleteCommentSchema, addReplySchema, deleteReplySchema } = require('../validators/noteValidator');

// Local Storage Config (Files uploaded to disk first for hashing)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// Map endpoints to controller functions
router.get('/search', validate(searchNotesSchema), searchNotes);
router.post('/upload', auth, upload.single('file'), validate(uploadNoteSchema), uploadNote);
router.post('/notes/:id/upvote', auth, validate(upvoteNoteSchema), upvoteNote);
router.post('/notes/:id/comments', auth, validate(addCommentSchema), addComment);
router.post('/notes/:id/visit', auth, visitNote);
router.delete('/notes/:noteId/comments/:commentId', auth, validate(deleteCommentSchema), deleteComment);
router.post('/notes/:noteId/comments/:commentId/replies', auth, validate(addReplySchema), addReply);
router.delete('/notes/:noteId/comments/:commentId/replies/:replyId', auth, validate(deleteReplySchema), deleteReply);

module.exports = router;