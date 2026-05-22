const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Proactive Security Headers Middleware (DevOps Best Practices)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for single-page application routing if needed, 
// though static middleware will automatically serve index.html at '/'
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Antigravity Server is flying high at: http://localhost:${PORT}`);
    console.log(`📁 Serving static assets from: ${path.join(__dirname, 'public')}\n`);
});

// Handle graceful shutdowns
process.on('SIGTERM', () => {
    console.log('Stopping server gracefully...');
    server.close(() => {
        console.log('Server stopped.');
    });
});
