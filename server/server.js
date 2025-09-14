// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Helpers
function formatDate(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function computeStreak(completedDates) {
  // completedDates are strings YYYY-MM-DD
  if (!completedDates || completedDates.length === 0) return 0;
  const set = new Set(completedDates);
  // start from today and count backwards
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = formatDate(cursor);
    if (set.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// Routes

// Create/find user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username });
      await user.save();
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by username
app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set goalDays
app.post('/api/setGoal', async (req, res) => {
  try {
    const { username, goalDays } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const user = await User.findOneAndUpdate(
      { username },
      { goalDays: Number(goalDays) || 0 },
      { new: true, upsert: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Select spirit animal
app.post('/api/selectAnimal', async (req, res) => {
  try {
    const { username, selectedAnimal } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const user = await User.findOneAndUpdate(
      { username },
      { selectedAnimal },
      { new: true, upsert: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark a day completed (adds date if not exists)
app.post('/api/saveDay', async (req, res) => {
  try {
    const { username, date } = req.body; // date in YYYY-MM-DD
    if (!username || !date) return res.status(400).json({ error: 'username and date required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.completedDates.includes(date)) {
      user.completedDates.push(date);
      user.daysCompleted = user.completedDates.length;
      user.streak = computeStreak(user.completedDates);
      await user.save();
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a completed day (toggle off)
app.post('/api/removeDay', async (req, res) => {
  try {
    const { username, date } = req.body;
    if (!username || !date) return res.status(400).json({ error: 'username and date required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const idx = user.completedDates.indexOf(date);
    if (idx !== -1) {
      user.completedDates.splice(idx, 1);
      user.daysCompleted = user.completedDates.length;
      user.streak = computeStreak(user.completedDates);
      await user.save();
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get progress (user)
app.get('/api/progress/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend (index and dashboard are in public)
// root and /dashboard handled by static serve. But keep root route for clarity.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/spirit', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/spirit.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
