const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Case = require('../models/Case');
const { auth, requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Submit a new case (all authenticated users)
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, category, department, location, severity, isAnonymous } = req.body;
    const attachments = (req.files || []).map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype
    }));
    const caseData = {
      title, description, category, department, location,
      severity: severity || 'Low',
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      submittedBy: req.user._id,
      submitterName: (isAnonymous === 'true' || isAnonymous === true) ? 'Anonymous' : req.user.name,
      attachments
    };
    const newCase = await Case.create(caseData);
    res.status(201).json(newCase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all cases (secretariat/admin)
router.get('/', auth, requireRole('secretariat', 'admin'), async (req, res) => {
  try {
    const { status, category, department, severity } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (department) filter.department = department;
    if (severity) filter.severity = severity;
    const cases = await Case.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get cases assigned to me (case_manager)
router.get('/my-cases', auth, requireRole('case_manager', 'secretariat', 'admin'), async (req, res) => {
  try {
    const cases = await Case.find({ assignedTo: req.user._id })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my own submitted cases (staff)
router.get('/submitted', auth, async (req, res) => {
  try {
    const cases = await Case.find({ submittedBy: req.user._id })
      .select('trackingId title status category severity createdAt')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single case
router.get('/:id', auth, async (req, res) => {
  try {
    const c = await Case.findById(req.params.id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('notes.author', 'name');
    if (!c) return res.status(404).json({ message: 'Case not found' });
    // Staff can only see their own cases unless anonymous
    if (req.user.role === 'staff' && c.submittedBy?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign case to case manager (secretariat)
router.patch('/:id/assign', auth, requireRole('secretariat', 'admin'), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const c = await Case.findByIdAndUpdate(req.params.id, {
      assignedTo,
      status: 'Assigned',
      assignedAt: new Date()
    }, { new: true }).populate('assignedTo', 'name email');
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update case status / add note (case_manager, secretariat)
router.patch('/:id/update', auth, requireRole('case_manager', 'secretariat', 'admin'), async (req, res) => {
  try {
    const { status, noteContent, impactSummary, actionTaken, whatChanged, isPublic } = req.body;
    const c = await Case.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });

    if (status) {
      c.status = status;
      if (status === 'Resolved') c.resolvedAt = new Date();
      c.lastResponseAt = new Date();
    }
    if (noteContent) {
      c.notes.push({ author: req.user._id, authorName: req.user.name, content: noteContent });
      c.lastResponseAt = new Date();
    }
    if (impactSummary !== undefined) c.impactSummary = impactSummary;
    if (actionTaken !== undefined) c.actionTaken = actionTaken;
    if (whatChanged !== undefined) c.whatChanged = whatChanged;
    if (isPublic !== undefined) c.isPublic = isPublic;

    await c.save();
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Analytics endpoint
router.get('/analytics/summary', auth, requireRole('secretariat', 'admin'), async (req, res) => {
  try {
    const [byStatus, byCategory, byDepartment, hotspots] = await Promise.all([
      Case.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Case.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Case.aggregate([
        { $match: { status: { $ne: 'Resolved' } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Case.aggregate([
        { $match: { status: { $ne: 'Resolved' } } },
        { $group: { _id: { department: '$department', category: '$category' }, count: { $sum: 1 } } },
        { $match: { count: { $gte: 5 } } }
      ])
    ]);
    res.json({ byStatus, byCategory, byDepartment, hotspots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
