const Competition = require("../models/Competition");
const Registration = require("../models/Registration");
const Submission = require("../models/Submission");
const { asyncHandler, AppError } = require("../utils/asyncHandler");

/**
 * Derives the competition's current lifecycle phase from real-time server
 * clock + stored dates. Never trust/accept a client-sent "now".
 *
 * Phases (mutually exclusive, in order):
 *  - upcoming            : now < registerBefore, spots available
 *  - registration_closed : now >= registerBefore (or spots full) AND now < submissionStart
 *  - submission_open      : now within [submissionStart, submissionEnd]
 *  - judging              : now within (submissionEnd, resultDate)
 *  - results_declared     : now >= resultDate
 */
function derivePhase(competition, now = new Date()) {
  const { registerBefore, submissionStart, submissionEnd, resultDate } = competition.dates;
  const spotsFull = competition.bookedSpots >= competition.totalSpots;
  const registrationOpen = now < registerBefore && !spotsFull;

  if (now >= resultDate) return "results_declared";
  if (now > submissionEnd) return "judging";
  if (now >= submissionStart && now <= submissionEnd) return "submission_open";
  if (registrationOpen) return "upcoming";
  return "registration_closed"; // deadline passed or spots full, submission window not yet open
}

/**
 * Builds the full response payload for the details screen: raw competition
 * data + computed fields the frontend needs to render state-dependent UI
 * (countdown target, spots left, user's participation state, which CTA to
 * show) without re-implementing date/business logic on the client.
 */
async function buildCompetitionResponse(competition, userId) {
  const now = new Date();
  const phase = derivePhase(competition, now);
  const spotsLeft = Math.max(competition.totalSpots - competition.bookedSpots, 0);

  let userState = "anonymous";
  let registration = null;
  let submission = null;

  if (userId) {
    registration = await Registration.findOne({
      competition: competition._id,
      user: userId,
      status: "registered",
    }).lean();

    submission = await Submission.findOne({
      competition: competition._id,
      user: userId,
    }).lean();

    if (submission) userState = "submitted";
    else if (registration) userState = "registered";
    else userState = "not_registered";
  }

    // Decide what the primary CTA should be. Every phase handles all viewer states:
  // anonymous (not logged in), not_registered, and registered/submitted.
  const isAnon = userState === "anonymous";
  const isParticipant = userState === "registered" || userState === "submitted";
  let cta = { label: "Registration Closed", action: "none", enabled: false };

  if (phase === "upcoming") {
    if (isParticipant) {
      cta = { label: "Registered", action: "none", enabled: false };
    } else if (isAnon) {
      cta = { label: "Login to Register", action: "login", enabled: true };
    } else {
      cta = { label: `Register (₹${competition.entryFee})`, action: "register", enabled: true };
    }
  } else if (phase === "registration_closed") {
    cta = isParticipant
      ? { label: "Registered", action: "none", enabled: false }
      : { label: "Registration Closed", action: "none", enabled: false };
  } else if (phase === "submission_open") {
    if (userState === "submitted") {
      cta = { label: "Submission Uploaded ✓", action: "none", enabled: false };
    } else if (userState === "registered") {
      cta = { label: "Upload Submission", action: "upload", enabled: true };
    } else if (isAnon) {
      cta = { label: "Login to Upload Submission", action: "login", enabled: true };
    } else {
      cta = { label: "Only Registered Users Can Submit", action: "none", enabled: false };
    }
  } else if (phase === "judging") {
    cta = { label: "Judging in Progress", action: "none", enabled: false };
  } else if (phase === "results_declared") {
    cta = { label: "View Results", action: "view_results", enabled: true };
  }

  return {
    id: competition._id,
    title: competition.title,
    tags: competition.tags,
    certificateForWinners: competition.certificateForWinners,
    prizePool: competition.prizePool,
    entryFee: competition.entryFee,
    totalSpots: competition.totalSpots,
    bookedSpots: competition.bookedSpots,
    spotsLeft,
    judge: competition.judge,
    dates: competition.dates,
    previousWinners: competition.previousWinners,
    aboutText: competition.aboutText,
    judgingParameters: competition.judgingParameters,
    rulesAndEligibility: competition.rulesAndEligibility,
    rewards: competition.rewards,
    disclaimer: competition.disclaimer,
    howPrizeMoneyVideoUrl: competition.howPrizeMoneyVideoUrl,
    refundPolicyUrl: competition.refundPolicyUrl,
    referral: {
      baseUrl: competition.referral?.baseUrl,
      rewardPerSignup: competition.referral?.rewardPerSignup ?? 0,
      // Per-user link so referrals can be attributed; anonymous viewers get the base URL.
      link: competition.referral?.baseUrl ? `${competition.referral.baseUrl}${userId || ""}` : null,
    },
    phase,
    serverTime: now.toISOString(),
    countdownTargetIso:
      phase === "upcoming"
        ? competition.dates.registerBefore
        : phase === "registration_closed"
        ? competition.dates.submissionStart
        : phase === "submission_open"
        ? competition.dates.submissionEnd
        : phase === "judging"
        ? competition.dates.resultDate
        : null,
    userState,
    isRegistered: userState === "registered" || userState === "submitted",
    hasSubmitted: userState === "submitted",
    cta,
  };
}

// GET /api/competitions/:id
const getCompetitionById = asyncHandler(async (req, res) => {
  const competition = await Competition.findOne({ _id: req.params.id, isActive: true });
  if (!competition) throw new AppError("Competition not found.", 404);

  const payload = await buildCompetitionResponse(competition, req.userId);
  res.json(payload);
});

// GET /api/competitions
const listCompetitions = asyncHandler(async (req, res) => {
  const competitions = await Competition.find({ isActive: true }).sort({ "dates.registerBefore": 1 });
  const payloads = await Promise.all(
    competitions.map((c) => buildCompetitionResponse(c, req.userId))
  );
  res.json(payloads);
});

/**
 * POST /api/competitions/:id/register
 *
 * Concurrency-safe registration under load:
 *  1. Atomically increment bookedSpots ONLY if bookedSpots < totalSpots AND
 *     the deadline hasn't passed. This single findOneAndUpdate is atomic in
 *     MongoDB - two simultaneous requests cannot both succeed once spots
 *     are full, because the condition is re-evaluated per-document write,
 *     not read-then-write from the app layer.
 *  2. Create the Registration document. The unique (competition, user)
 *     index prevents the same user from double-booking a spot even under a
 *     race (e.g. a double-tap or retried request).
 *  3. If step 2 fails (duplicate), we must roll back the increment from
 *     step 1 so the spot isn't lost - we decrement bookedSpots back.
 *  4. If step 2 fails for a genuinely new registration attempt (rare infra
 *     error), we also roll back to avoid leaking a spot.
 */
const registerForCompetition = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const now = new Date();

  const competition = await Competition.findOne({ _id: req.params.id, isActive: true });
  if (!competition) throw new AppError("Competition not found.", 404);

  if (now >= competition.dates.registerBefore) {
    throw new AppError("Registration has closed for this competition.", 409);
  }

  // Fast pre-check for a clear, friendly error (not the source of safety -
  // the atomic update below is).
  const existing = await Registration.findOne({
    competition: competition._id,
    user: userId,
    status: "registered",
  });
  if (existing) {
    throw new AppError("You are already registered for this competition.", 409);
  }

  const reserved = await Competition.findOneAndUpdate(
    {
      _id: competition._id,
      bookedSpots: { $lt: competition.totalSpots },
      "dates.registerBefore": { $gt: now },
    },
    { $inc: { bookedSpots: 1 } },
    { new: true }
  );

  if (!reserved) {
    throw new AppError("Sorry, all spots have been filled or registration just closed.", 409);
  }

  try {
    const registration = await Registration.create({
      competition: competition._id,
      user: userId,
    });

    const payload = await buildCompetitionResponse(reserved, userId);
    return res.status(201).json({ message: "Registered successfully.", registrationId: registration._id, competition: payload });
  } catch (err) {
    // Roll back the spot we reserved, since the Registration write failed
    // (most likely a duplicate-key race from a concurrent duplicate
    // request for the same user, or a transient DB error).
    await Competition.updateOne({ _id: competition._id }, { $inc: { bookedSpots: -1 } });

    if (err.code === 11000) {
      throw new AppError("You are already registered for this competition.", 409);
    }
    throw err;
  }
});


//POST /api/competitions/:id/submit
const submitEntry = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const now = new Date();
  const { mediaUrl, caption } = req.body;

  if (!mediaUrl) throw new AppError("mediaUrl is required.", 400);

  const competition = await Competition.findOne({ _id: req.params.id, isActive: true });
  if (!competition) throw new AppError("Competition not found.", 404);

  const { submissionStart, submissionEnd } = competition.dates;
  if (now < submissionStart || now > submissionEnd) {
    throw new AppError("Submissions are not open right now.", 409);
  }

  const registration = await Registration.findOne({
    competition: competition._id,
    user: userId,
    status: "registered",
  });
  if (!registration) {
    throw new AppError("Only registered participants can submit an entry.", 403);
  }

  try {
    const submission = await Submission.findOneAndUpdate(
      { competition: competition._id, user: userId },
      { mediaUrl, caption, submittedAt: now, eligibleForJudging: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const payload = await buildCompetitionResponse(competition, userId);
    res.status(200).json({ message: "Submission saved.", submissionId: submission._id, competition: payload });
  } catch (err) {
    throw err;
  }
});

module.exports = {
  listCompetitions,
  getCompetitionById,
  registerForCompetition,
  submitEntry,
  derivePhase, // exported for unit testing
};
