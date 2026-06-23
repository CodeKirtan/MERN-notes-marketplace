const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { searchNotes, uploadNote } = require('../controllers/noteController');

// Multer Storage Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Map endpoints to controller functions
router.get('/search', searchNotes);
router.post('/upload', upload.single('file'), uploadNote);

module.exports = router;