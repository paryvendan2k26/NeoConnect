const router = require('express').Router();
const Poll = require('../models/Poll');
const { auth, requireRole } = require('../middleware/auth');

// Create poll (secretariat)
router.post('/', auth, requireRole('secretariat', 'admin'), async (req, res) => {
  try {
    const { question, options, endsAt } = req.body;
    const poll = await Poll.create({
      question,
      options: options.map(text => ({ text, votes: [] })),
      createdBy: req.user._id,
      endsAt
    });
    res.status(201).json(poll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all polls
router.get('/', auth, async (req, res) => {
  try {
    const polls = await Poll.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Vote on a poll
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll || !poll.isActive) return res.status(400).json({ message: 'Poll not available' });

    // Check if already voted
    const alreadyVoted = poll.options.some(opt =>
      opt.votes.map(v => v.toString()).includes(req.user._id.toString())
    );
    if (alreadyVoted) return res.status(400).json({ message: 'Already voted' });

    poll.options[optionIndex].votes.push(req.user._id);
    await poll.save();
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle poll active status
router.patch('/:id/toggle', auth, requireRole('secretariat', 'admin'), async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    poll.isActive = !poll.isActive;
    await poll.save();
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
