const express = require("express");
const rateLimit = require("express-rate-limit");
const { optionalAuth, requireAuth } = require("../middleware/auth");
const {
  listCompetitions,
  getCompetitionById,
  registerForCompetition,
  submitEntry,
} = require("../controllers/competitionController");

const router = express.Router();

// Registration is the hottest, most contention-prone endpoint (limited
// spots, many users hitting it near a deadline) - rate-limit per IP as a
// basic abuse guard on top of the atomic DB-level safety.
const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a moment." },
  skip: () => process.env.DISABLE_RATE_LIMIT === "true",
});

router.get("/", optionalAuth, listCompetitions);
router.get("/:id", optionalAuth, getCompetitionById);
router.post("/:id/register", requireAuth, registerLimiter, registerForCompetition);
router.post("/:id/submit", requireAuth, submitEntry);

module.exports = router;
