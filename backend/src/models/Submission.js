const mongoose = require("mongoose");
const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    competition: { type: Schema.Types.ObjectId, ref: "Competition", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mediaUrl: { type: String, required: true }, // uploaded to S3/Cloud storage; URL stored here
    caption: { type: String },
    submittedAt: { type: Date, default: Date.now },
    // Only registered, paid participants' submissions count for judging
    // (per the "Disclaimer" shown in the design) - enforced in the
    // controller, mirrored here for auditability/reporting.
    eligibleForJudging: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A user can only have one active submission per competition in this MVP.
submissionSchema.index({ competition: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);
