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
      const lastInteraction = await Interaction.findOne({ userId }).sort({ timestamp: -1 });
      const sentiment = await analyzeSentiment(message);
      let emotion;
      if (sentiment > 0.2) {
        emotion = 'happy';
      } else if (sentiment < -0.2) {
        emotion = 'sad';
      } else {
        emotion = 'neutral';
      }
      let context = lastInteraction ? lastInteraction.context : null;
      let prompt;
      if (context === 'wellness-tools') {
        const selectedTool = message.toLowerCase();
        if (selectedTool.includes('breathing')) {
          prompt = `
            You are MindAlly, a mental health chatbot. The user has chosen the guided breathing exercise.
            Provide the steps for the exercise:
            "Find a quiet place and sit comfortably. Close your eyes and take a deep breath in through your nose for 4 seconds. Hold your breath for 4 seconds. Exhale slowly through your mouth for 6 seconds. Repeat this cycle for 5 minutes."
          `;
        } else if (selectedTool.includes('meditation')) {
          prompt = `
            You are MindAlly, a mental health chatbot. The user has chosen the mindfulness meditation.
            Provide the steps for the meditation:
            "Sit or lie down in a comfortable position. Close your eyes and focus on your breath. If your mind wanders, gently bring your focus back to your breath. Continue for 5-10 minutes."
          `;
        } else if (selectedTool.includes('stress')) {
          prompt = `
            You are MindAlly, a mental health chatbot. The user has chosen stress management tips.
            Provide the tips:
            "1. Take a short walk to clear your mind. 2. Write down your thoughts in a journal. 3. Listen to calming music or nature sounds. 4. Practice gratitude by listing 3 things you’re thankful for."
          `;
        } else {
          prompt = `
            You are MindAlly, a mental health chatbot. The user did not select a valid wellness tool.
            Respond empathetically and ask them to choose again:
            "I’m sorry, I didn’t understand your choice. Please select one of the following: breathing, meditation, or stress."
          `;
        }
      } else if (context === 'follow-up' && message.toLowerCase().includes('yes')) {
        prompt = `
          You are MindAlly, a mental health chatbot. The user is feeling ${emotion}.
          They agreed to talk more about their feelings. Respond empathetically and ask another follow-up question.
          For example: "I'm here to listen. What’s been on your mind lately?"
        `;
      } else if (context === 'follow-up') {
        prompt = `
          You are MindAlly, a mental health chatbot. The user is feeling ${emotion}.
          They shared more about their feelings: "${message}".
          Respond empathetically and ask another follow-up question.
          For example: "That sounds tough. How long have you been feeling this way?"
        `;
      } else {
        if (context === 'follow-up'|| emotion === 'sad' || emotion === 'stressed' || emotion === 'anxious') {
          prompt = `
            You are MindAlly, a mental health chatbot. The user is feeling ${emotion}.
            Respond empathetically to their message: "${message}".
            Ask if they would like to use any wellness tools:
            "It sounds like you're feeling ${emotion}. Would you like to try a wellness tool to help you feel better? You can choose from: breathing, meditation, or stress management."
          `;
        } else {
          prompt = `
            You are MindAlly, a mental health chatbot. The user is feeling ${emotion}.
            Respond empathetically to their message: "${message}".
            Ask a follow-up question to encourage them to share more, such as:
            "Would you like to talk more about how you're feeling?"
          `;
        }
      }
      const result = await model.generateContent(prompt);
      const reply = result.response.text();
      const interaction = new Interaction({
        userId: userId || 'anonymous',
        message,
        emotion,
        context: context === 'wellness-tools' ? 'wellness-tools' : 'follow-up',
      });
      await interaction.save();
  
      res.json({
        reply: reply.trim(),
        detectedEmotion: emotion,
      });
  
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
  });