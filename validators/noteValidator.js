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
    body: z.object({
        action: z.enum(['upvote', 'downvote'], { required_error: "Action must be 'upvote' or 'downvote'" })
    })
});

const addCommentSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Note ID is required')
    }),
    body: z.object({
        text: z.string({ required_error: 'Comment text is required' }).min(1, 'Comment text is required'),
        author: z.string().optional()
    })
});

module.exports = { uploadNoteSchema, searchNotesSchema, upvoteNoteSchema, addCommentSchema };
