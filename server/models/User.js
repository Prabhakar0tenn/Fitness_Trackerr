// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  selectedAnimal: {
    type: String,
    default: null
  },
  streak: {
    type: Number,
    default: 0
  },
  goalDays: {
    type: Number,
    default: 0
  },
  daysCompleted: {
    type: Number,
    default: 0
  },
  completedDates: {
    type: [String], // store dates as "YYYY-MM-DD"
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
