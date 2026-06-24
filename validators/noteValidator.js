const { z } = require('zod');

const uploadNoteSchema = z.object({
    body: z.object({
        title: z.string({ required_error: 'Title is required' }).min(1, 'Title is required'),
        subject: z.string({ required_error: 'Subject is required' }).min(1, 'Subject is required'),
        branch: z.string({ required_error: 'Branch is required' }).min(1, 'Branch is required'),
        semester: z.string({ required_error: 'Semester is required' }).min(1, 'Semester is required'),
        tags: z.any().optional()
    })
});

const searchNotesSchema = z.object({
    query: z.object({
        query: z.string().optional(),
        branch: z.string().optional(),
        semester: z.string().optional(),
        sortBy: z.string().optional()
    })
});

const upvoteNoteSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Note ID is required')
    }),
    body: z.object({}).optional()
});

const addCommentSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Note ID is required')
    }),
    body: z.object({
        text: z.string({ required_error: 'Comment text is required' }).min(1, 'Comment text is required')
    })
});

const deleteCommentSchema = z.object({
    params: z.object({
        noteId: z.string().min(1, 'Note ID is required'),
        commentId: z.string().min(1, 'Comment ID is required')
    })
});

module.exports = { uploadNoteSchema, searchNotesSchema, upvoteNoteSchema, addCommentSchema, deleteCommentSchema };
