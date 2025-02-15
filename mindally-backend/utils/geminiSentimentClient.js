const dotenv= require('dotenv')
dotenv.config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
async function analyzeSentimentUsingGemini(text) {
    try {
        const prompt = `
        Analyze the emotional tone of this message and classify it into one of the following emotions: 
        - Happy
        - Sad
        - Angry
        - Stressed
        - Anxious
        - Neutral
        - Excited

        Also, determine if the user is selecting a wellness tool (yes/no).
        Wellness tools include: breathing, meditation, stress management.

        Format the response as:
        Emotion: <emotion>
        WellnessTool: <yes/no>

        Message: "${text}"
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        const emotionMatch = responseText.match(/Emotion:\s*(\w+)/);
        const wellnessMatch = responseText.match(/WellnessTool:\s*(\w+)/);

        return {
            emotion: emotionMatch ? emotionMatch[1].toLowerCase() : "neutral",
            selectedWellnessTool: wellnessMatch ? wellnessMatch[1].toLowerCase() === "yes" : false,
        };
    } catch (error) {
        console.error("Error analyzing sentiment:", error);
        return { emotion: "neutral", selectedWellnessTool: false };
    }
}
module.exports = {analyzeSentimentUsingGemini};
