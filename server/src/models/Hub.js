const mongoose = require('mongoose');

const minuteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  filename: String,
  originalName: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  meetingDate: Date,
  tags: [String]
}, { timestamps: true });

const digestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  quarter: String,
  year: Number,
  summary: String,
  content: String,
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = {
  Minute: mongoose.model('Minute', minuteSchema),
  Digest: mongoose.model('Digest', digestSchema)
};
