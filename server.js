import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static files from the Vite build output
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy endpoint for Gemini API
app.post('/api/chat', async (req, res) => {
    try {
        const { contents, systemInstruction } = req.body;
        
        // Use GEMINI_API_KEY (WITHOUT VITE_ prefix to keep it safe on backend)
        const apiKey = process.env.GEMINI_API_KEY;
        const apiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`;

        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing from environment variables");
            return res.status(500).json({ error: { message: "API Configuration missing on server." } });
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contents, systemInstruction })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API error:", data);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error("Server error during chat:", error);
        res.status(500).json({ error: { message: "Internal server error" } });
    }
});

// Handle SPA routing: serve index.html for any unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
