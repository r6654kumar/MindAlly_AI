const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv')
const connectDB = require('./config/db')
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(bodyParser.json());
connectDB();
//POST ROUTE FOR CHAT
const chatRoute = require('./routes/chatRoute');
app.use('/api', chatRoute);

app.get('/', (req, res) => {
  res.send('MindAlly API is running!');
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

