const router = require('express').Router();
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

// Get all users (admin)
router.get('/', auth, requireRole('admin', 'secretariat'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get case managers only
router.get('/case-managers', auth, requireRole('secretariat', 'admin'), async (req, res) => {
  try {
    const cms = await User.find({ role: 'case_manager', isActive: true }).select('name email department');
    res.json(cms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user (admin)
router.patch('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { role, isActive, department } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isActive, department },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user (admin)
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
