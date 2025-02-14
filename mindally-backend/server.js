const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose= require('mongoose')
const dotenv= require('dotenv')
const { analyzeSentiment } = require('./utils/sentimentClient');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Interaction = require('./models/Interaction');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODBURL = process.env.MONGODBURL;
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('MindAlly API is running!');
});

// MONGO DB CONNECTION

mongoose
  .connect(MONGODBURL)
  .then(() => {
    console.log("Successfully connected to database");
    app.listen(PORT, () => {
      console.log(`App is listening to port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`Error:${error}`);
  });

//GEMINI AI CONFIGURATION
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
//POST ROUTE FOR CHAT
app.post('/chat', async (req, res) => {
    const { message, userId } = req.body;
  
    try {
      const sentiment = await analyzeSentiment(message);
      let emotion;
      if (sentiment > 0.2) {
        emotion = 'happy';
      } else if (sentiment < -0.2) {
        emotion = 'sad';
      } else {
        emotion = 'neutral';
      }
      const interaction = new Interaction({
        userId: userId || 'anonymous',
        message,
        emotion,
      });
      let prompt;
      if (emotion === 'sad') {
        prompt = `
          You are MindAlly, a mental health chatbot. The user is feeling ${emotion}.
          Respond empathetically to their message: "${message}".
          Ask a follow-up question to encourage them to share more, such as:
          "Would you like to talk more about what's bothering you?"
        `;
      } else if (emotion === 'happy') {
        prompt = `
          You are MindAlly, a mental health chatbot. The user is feeling ${emotion}.
          Respond positively to their message: "${message}".
          Ask a follow-up question to keep the conversation going, such as:
          "That's great to hear! What made you feel this way?"
        `;
      } else {
        prompt = `
          You are MindAlly, a mental health chatbot. The user is feeling ${emotion}.
          Respond empathetically to their message: "${message}".
          Ask a follow-up question to encourage them to share more, such as:
          "Tell me more about how you're feeling."
        `;
      }
      const result = await model.generateContent(prompt);
      const reply = result.response.text();
  
      res.json({
        reply: reply.trim(),
        detectedEmotion: emotion,
      });
  
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
  });