const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { Minute, Digest } = require('../models/Hub');
const Case = require('../models/Case');
const { auth, requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// --- DIGESTS ---
router.get('/digests', auth, async (req, res) => {
  try {
    const digests = await Digest.find({ isPublished: true })
      .populate('publishedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(digests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/digests', auth, requireRole('secretariat', 'admin'), async (req, res) => {
  try {
    const digest = await Digest.create({ ...req.body, publishedBy: req.user._id });
    res.status(201).json(digest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- IMPACT TRACKING ---
router.get('/impact', auth, async (req, res) => {
  try {
    const cases = await Case.find({
      status: 'Resolved',
      isPublic: true,
      actionTaken: { $exists: true, $ne: '' }
    }).select('trackingId title category department actionTaken whatChanged resolvedAt impactSummary')
      .sort({ resolvedAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- MINUTES ---
router.get('/minutes', auth, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search ? { $or: [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ]} : {};
    const minutes = await Minute.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ meetingDate: -1 });
    res.json(minutes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/minutes', auth, requireRole('secretariat', 'admin'), upload.single('file'), async (req, res) => {
  try {
    const { title, description, meetingDate, tags } = req.body;
    const minute = await Minute.create({
      title, description,
      filename: req.file?.filename,
      originalName: req.file?.originalname,
      meetingDate,
      tags: tags ? JSON.parse(tags) : [],
      uploadedBy: req.user._id
    });
    res.status(201).json(minute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
