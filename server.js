const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for plane detection (simplified)
app.post('/api/detect-plane', (req, res) => {
    // In a real implementation, this would process image data for plane detection
    // For this demo, we'll just return a mock response
    res.json({
        success: true,
        plane: {
            position: { x: 0, y: 0, z: -2 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Open http://localhost:${port} in your browser`);
});
