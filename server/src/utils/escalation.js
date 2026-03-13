const cron = require('node-cron');
const Case = require('../models/Case');

function getWorkingDaysDiff(date1, date2) {
  let count = 0;
  const d = new Date(date1);
  while (d <= date2) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function startEscalationCron() {
  // Run every day at 8am
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running 7-day escalation check...');
    try {
      const now = new Date();
      const cases = await Case.find({
        status: { $in: ['Assigned', 'In Progress', 'Pending'] },
        assignedAt: { $exists: true }
      }).populate('assignedTo', 'name email');

      for (const c of cases) {
        const referenceDate = c.lastResponseAt || c.assignedAt;
        const workingDays = getWorkingDaysDiff(referenceDate, now);

        if (workingDays >= 7) {
          c.status = 'Escalated';
          await c.save();
          console.log(`[Escalation] Case ${c.trackingId} escalated. CM: ${c.assignedTo?.name}`);
          // In production: send email notification here
        }
      }
    } catch (err) {
      console.error('[Cron] Escalation error:', err.message);
    }
  });

  console.log('[Cron] Escalation job scheduled (daily at 8am)');
}

module.exports = { startEscalationCron };
