const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * One document per (competition, user) pair. The unique compound index is
 * the real concurrency safety net: even if two requests from the same user
 * race past the spots-check at the same instant, only one insert can
 * succeed here - the second throws E11000 and we treat it as
 * "already registered" rather than a hard failure.
 */
const registrationSchema = new Schema(
  {
    competition: { type: Schema.Types.ObjectId, ref: "Competition", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["registered", "cancelled"],
      default: "registered",
    },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

registrationSchema.index({ competition: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
