require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Case = require('./src/models/Case');
const Poll = require('./src/models/Poll');
const { Digest } = require('./src/models/Hub');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Seeding...');

  await User.deleteMany({});
  await Case.deleteMany({});
  await Poll.deleteMany({});
  await Digest.deleteMany({});

  const admin = await User.create({ name: 'IT Admin', email: 'admin@neo.com', password: 'password123', role: 'admin', department: 'IT' });
  const secretariat = await User.create({ name: 'Jane Secretariat', email: 'jane@neo.com', password: 'password123', role: 'secretariat', department: 'Management' });
  const cm1 = await User.create({ name: 'Mark Manager', email: 'mark@neo.com', password: 'password123', role: 'case_manager', department: 'HR' });
  const cm2 = await User.create({ name: 'Lisa Handler', email: 'lisa@neo.com', password: 'password123', role: 'case_manager', department: 'Facilities' });
  const staff1 = await User.create({ name: 'Alice Staff', email: 'alice@neo.com', password: 'password123', role: 'staff', department: 'Engineering' });
  const staff2 = await User.create({ name: 'Bob Worker', email: 'bob@neo.com', password: 'password123', role: 'staff', department: 'Engineering' });

  const cases = await Case.insertMany([
    { title: 'Broken AC in Floor 3', description: 'The air conditioning has been broken for 2 weeks.', category: 'Facilities', department: 'Engineering', location: 'Floor 3', severity: 'High', submittedBy: staff1._id, submitterName: 'Alice Staff', status: 'In Progress', assignedTo: cm2._id, assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), lastResponseAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { title: 'Unsafe ladder in warehouse', description: 'The ladder has broken rungs and is a safety hazard.', category: 'Safety', department: 'Operations', location: 'Warehouse B', severity: 'High', submittedBy: staff2._id, submitterName: 'Anonymous', isAnonymous: true, status: 'Escalated', assignedTo: cm1._id, assignedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    { title: 'Unclear remote work policy', description: 'The policy on remote work days is contradictory.', category: 'Policy', department: 'HR', severity: 'Medium', submittedBy: staff1._id, submitterName: 'Alice Staff', status: 'Resolved', assignedTo: cm1._id, resolvedAt: new Date(), isPublic: true, actionTaken: 'HR updated the remote work policy document', whatChanged: 'Staff can now work remotely 3 days per week with manager approval', impactSummary: 'Policy clarified and published to all staff' },
    { title: 'Parking lot lighting inadequate', description: 'Night shift workers feel unsafe walking to their cars.', category: 'Safety', department: 'Operations', severity: 'Medium', submittedBy: staff2._id, submitterName: 'Bob Worker', status: 'New' },
    { title: 'Cafeteria food quality decline', description: 'Food quality has significantly dropped this month.', category: 'Facilities', department: 'Engineering', severity: 'Low', submittedBy: staff1._id, submitterName: 'Alice Staff', status: 'Assigned', assignedTo: cm2._id, assignedAt: new Date() },
    { title: 'HR onboarding process too slow', description: 'New hires wait 3 weeks for system access.', category: 'HR', department: 'Engineering', severity: 'Medium', submittedBy: staff2._id, submitterName: 'Bob Worker', status: 'New' },
  ]);

  await Poll.create({
    question: 'What time should the all-hands meeting be held?',
    options: [
      { text: '9:00 AM', votes: [staff1._id] },
      { text: '11:00 AM', votes: [staff2._id, cm1._id] },
      { text: '2:00 PM', votes: [cm2._id] },
      { text: '4:00 PM', votes: [] }
    ],
    createdBy: secretariat._id,
    isActive: true
  });

  await Digest.create({
    title: 'Q1 2025 Staff Feedback Digest',
    quarter: 'Q1',
    year: 2025,
    summary: 'This quarter saw 24 cases submitted across all departments, with an 83% resolution rate.',
    content: 'Key highlights this quarter include significant improvements to the facilities in Building A following staff feedback. The remote work policy was clarified after multiple HR queries. Safety protocols were updated in the warehouse following an escalated case.',
    publishedBy: secretariat._id,
    isPublished: true
  });

  console.log('\n✅ Seed complete! Demo accounts:');
  console.log('  admin@neo.com       / password123  (Admin)');
  console.log('  jane@neo.com        / password123  (Secretariat)');
  console.log('  mark@neo.com        / password123  (Case Manager)');
  console.log('  lisa@neo.com        / password123  (Case Manager)');
  console.log('  alice@neo.com       / password123  (Staff)');
  console.log('  bob@neo.com         / password123  (Staff)\n');

  await mongoose.disconnect();
}

seed().catch(console.error);
