const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    filePath: { type: String, required: true },
    branch: { type: String, required: true, default: 'Other' },
    semester: { type: Number, required: true, default: 1 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: { type: [String], default: [] },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
        {
            text: { type: String, required: true },
            author: { type: String, required: true },
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

noteSchema.index({ title: 'text', subject: 'text' });

module.exports = mongoose.model('Note', noteSchema);