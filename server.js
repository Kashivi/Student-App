// server.js
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // Serve static files from the "public" directory

// Route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));  // Update the path as needed
});

// API endpoint for Code Execution
app.post('/api/groq', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ reply: response.data.choices?.[0]?.message?.content || "No reply returned." });
  } catch (err) {
    console.error("Groq API Error:", err?.response?.data || err.message);
    res.status(500).json({ error: 'Error contacting Groq API' });
  }
});

app.post('/api/translate', async (req, res) => {
  const { text, fromLang, toLang } = req.body;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        temperature: 0, // <--- Add this line to make the output deterministic
        messages: [
          {
            role: 'system',
            content: 'You are a translation engine. Return only the translation and its pronunciation in this format:\nTranslation: ...\nPronunciation: ...'
          },
          {
            role: 'user',
            content: `Translate from ${fromLang} to ${toLang} and give pronunciation. Text: "${text}"`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    

    const content = response.data.choices?.[0]?.message?.content || "";
    
    // Simple regex parsing
    const translationMatch = content.match(/Translation:\s*(.+)/i);
    const pronunciationMatch = content.match(/Pronunciation:\s*(.+)/i);

    res.json({
      translation: translationMatch?.[1]?.trim() || "Translation failed.",
      pronunciation: pronunciationMatch?.[1]?.trim() || "Pronunciation not available."
    });

  } catch (error) {
    console.error("Translation error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Error translating text. Please try again." });
  }
});




// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Route to serve codeeditor.html
app.get('/codeeditor.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'codeeditor.html'));
});

app.get('/chatgpt.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'chatgpt.html'));
});

app.get('/translator.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'translator.html'));
});

