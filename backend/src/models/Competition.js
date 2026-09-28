const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Design notes:
 * - We deliberately do NOT store a "status" (open/closed/full) field on the
 *   document. Status is always DERIVED at request time from `bookedSpots`,
 *   `totalSpots`, and the date fields. Storing derived state invites drift
 *   (e.g. a cron job failing to flip "open" -> "closed" at the deadline).
 *   See controllers/competitionController.js -> deriveCompetitionState().
 * - `bookedSpots` is a counter maintained via atomic $inc operations rather
 *   than by counting Registration documents on every request. This keeps
 *   the hot "how many spots left" read O(1) and cheap under high concurrency.
 *   The Registration collection remains the source of truth for *who* is
 *   registered, and a reconciliation script could recompute bookedSpots
 *   from it if the two ever drift (see README trade-offs).
 */

const winnerSchema = new Schema(
  {
    name: { type: String, required: true },
    position: { type: Number, required: true }, // 1, 2, 3...
    imageUrl: { type: String },
    videoUrl: { type: String },
  },
  { _id: false }
);

const rewardSchema = new Schema(
  {
    position: { type: Number, required: true },
    label: { type: String, required: true }, // "1st Winner"
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const judgeSchema = new Schema(
  {
    name: { type: String, required: true },
    title: { type: String },
    experience: { type: String }, // "12+ Years of Experience"
    intro: {type:String},
    avatarUrl: { type: String },
    introVideoUrl: { type: String },
  },
  { _id: false }
);

const competitionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    tags: [{ type: String }], // ["Dance", "Multi-Win"]
    certificateForWinners: { type: Boolean, default: false },

    prizePool: { type: Number, required: true, min: 0 },
    entryFee: { type: Number, required: true, min: 0 },

    totalSpots: { type: Number, required: true, min: 1 },
    bookedSpots: { type: Number, required: true, default: 0, min: 0 },

    judge: judgeSchema,

    // Lifecycle dates - all stored as real Date objects (UTC) so the
    // backend, not the client clock, is the source of truth for "now".
    dates: {
      registerBefore: { type: Date, required: true },
      submissionStart: { type: Date, required: true },
      submissionEnd: { type: Date, required: true },
      resultDate: { type: Date, required: true },
    },

    previousWinners: [winnerSchema],

    aboutText: { type: String },
    judgingParameters: { type: String },
    rulesAndEligibility: { type: String },

    rewards: [rewardSchema],

    disclaimer: { type: String },
    howPrizeMoneyVideoUrl: { type: String },
    refundPolicyUrl: { type: String },

    referral: {
      baseUrl: { type: String }, // e.g. https://feedants.com/r/
      rewardPerSignup: { type: Number, default: 0 },
    },

    isActive: { type: Boolean, default: true }, // soft-delete / hide flag
  },
  { timestamps: true }
);

competitionSchema.index({ "dates.registerBefore": 1 });
competitionSchema.index({ isActive: 1 });

module.exports = mongoose.model("Competition", competitionSchema);
