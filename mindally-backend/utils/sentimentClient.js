const axios = require('axios');

const analyzeSentiment = async (message) => {
  try {
    const response = await axios.post('http://localhost:5001/analyze-sentiment', {
      message,
    });
    return response.data.sentiment;
  } catch (error) {
    console.error('Error calling Python service:', error);
    return 0;
  }
};

module.exports = { analyzeSentiment };