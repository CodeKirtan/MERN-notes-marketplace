const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. Token format must be Bearer <token>.' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback_notes_marketplace_secret_key_123';
        const verified = jwt.verify(token, secret);
        req.user = verified; // verified contains { id, email }
        next();
    } catch (err) {
        console.error('JWT verify error:', err.message);
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
