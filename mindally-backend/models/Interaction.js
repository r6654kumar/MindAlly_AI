const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userId: String,
  message: String,
  emotion: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Interaction', interactionSchema);