const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const dotenv = require('dotenv')
// const { analyzeSentiment } = require('./utils/sentimentClient');
const { analyzeSentimentUsingGemini } = require('./utils/geminiSentimentClient');
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
    const lastInteraction = await Interaction.findOne({ userId }).sort({ timestamp: -1 });
    const { emotion, selectedWellnessTool } = await analyzeSentimentUsingGemini(message);
    let context = lastInteraction ? lastInteraction.context : null;
    let prompt;

    if (selectedWellnessTool) {
      const selectedTool = message.toLowerCase();
      if (selectedTool.includes("breathing")) {
        prompt = `
              The user selected guided breathing exercises. 
              Provide the steps:
              "Find a quiet place and sit comfortably. Close your eyes and take a deep breath in through your nose for 4 seconds. Hold your breath for 4 seconds. Exhale slowly through your mouth for 6 seconds. Repeat for 5 minutes."
              `;
      } else if (selectedTool.includes("meditation")) {
        prompt = `
              The user selected mindfulness meditation.
              Provide the steps for meditation according to you, and go slow:
              `;
      } else if (selectedTool.includes("stress")) {
        prompt = `
              The user selected stress management techniques.
              Provide the tips:
              "1. Take a short walk to clear your mind. 2. Write down your thoughts in a journal. 3. Listen to calming music or nature sounds. 4. Practice gratitude by listing 3 things you’re thankful for."
              `;
      } else {
        prompt = `
              The user mentioned wellness tools but didn't choose a valid option.
              Ask them to pick one: breathing, meditation, or stress management.
              `;
      }
      context = "wellness-tools";
    } else if (context === "follow-up" && message.toLowerCase().includes("yes")) {
      prompt = `
          The user is feeling ${emotion}.
          They agreed to talk more. Ask another follow-up question.
          Example: "I'm here to listen. What’s been on your mind lately?"
          `;
    } else if (context === "follow-up") {
      prompt = `
          The user is feeling ${emotion}.
          They shared: "${message}".
          Respond empathetically and ask another follow-up question.
          Example: "That sounds tough. How long have you been feeling this way?"
          `;
    } else {
      prompt = `
          The user is feeling ${emotion}.
          Respond empathetically to: "${message}".
          Ask if they would like to try wellness tools like breathing, meditation, or stress management.
          `;
    }

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    const interaction = new Interaction({
      userId: userId || 'anonymous',
      message,
      emotion,
      context: selectedWellnessTool ? 'wellness-tools' : 'follow-up',
    });

    await interaction.save();

    res.json({ reply: reply.trim(), detectedEmotion: emotion });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
