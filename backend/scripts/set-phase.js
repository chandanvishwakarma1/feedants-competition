/**
 * Puts the first competition into a given state so you can see every UI state on the phone.
 *   npm run phase -- login|upcoming|last_spot|full|closed|submission|judging|results
 * Then pull-to-refresh in the app.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Competition = require("../src/models/Competition");
const Registration = require("../src/models/Registration");
const Submission = require("../src/models/Submission");

const DAY = 24 * 60 * 60 * 1000;
const d = (n) => new Date(Date.now() + n * DAY);
const open = { registerBefore: d(1.25), submissionStart: d(5), submissionEnd: d(25), resultDate: d(28) };

const PHASES = {
  // Clean slate for the login -> register flow: registration open, 1/20 booked,
  // and every registration/submission on this competition wiped.
  login:      { dates: open, bookedSpots: 1, reset: true },
  upcoming:   { dates: open, bookedSpots: 1 },
  last_spot:  { dates: open, bookedSpots: "total-1" },
  full:       { dates: open, bookedSpots: "total" },
  closed:     { dates: { registerBefore: d(-2), submissionStart: d(3), submissionEnd: d(25), resultDate: d(28) } },
  submission: { dates: { registerBefore: d(-5), submissionStart: d(-1), submissionEnd: d(10), resultDate: d(14) } },
  judging:    { dates: { registerBefore: d(-20), submissionStart: d(-15), submissionEnd: d(-1), resultDate: d(5) } },
  results:    { dates: { registerBefore: d(-20), submissionStart: d(-15), submissionEnd: d(-5), resultDate: d(-1) } },
};

(async () => {
  const phase = process.argv[2];
  if (!PHASES[phase]) {
    console.log("Usage: npm run phase -- <" + Object.keys(PHASES).join("|") + ">");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const comp = await Competition.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!comp) {
    console.log("No competition found. Run `npm run seed` first.");
    process.exit(1);
  }
  const cfg = PHASES[phase];

  const update = { dates: cfg.dates };
  if (cfg.bookedSpots === "total") update.bookedSpots = comp.totalSpots;
  else if (cfg.bookedSpots === "total-1") update.bookedSpots = comp.totalSpots - 1;
  else if (typeof cfg.bookedSpots === "number") update.bookedSpots = cfg.bookedSpots;

  if (cfg.reset) {
    const regs = await Registration.deleteMany({ competition: comp._id });
    const subs = await Submission.deleteMany({ competition: comp._id });
    console.log(`Cleared ${regs.deletedCount} registrations and ${subs.deletedCount} submissions.`);
  }

  await Competition.updateOne({ _id: comp._id }, { $set: update });
  console.log(`Competition ${comp._id} -> "${phase}". Pull to refresh in the app.`);
  await mongoose.connection.close();
})();