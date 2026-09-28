require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Competition = require("../models/Competition");

async function seed() {
  await connectDB(process.env.MONGO_URI);

  await Competition.deleteMany({});

  const now = new Date();
  const registerBefore = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000); // ~1d 6h from now
  const submissionStart = new Date(registerBefore.getTime() + 4 * 24 * 60 * 60 * 1000);
  const submissionEnd = new Date(submissionStart.getTime() + 24 * 24 * 60 * 60 * 1000);
  const resultDate = new Date(submissionEnd.getTime() + 2 * 24 * 60 * 60 * 1000);

  await Competition.create({
    title: "Feedants Classical Dance",
    tags: ["Dance", "Multi-Win"],
    certificateForWinners: true,
    prizePool: 1500,
    entryFee: 99,
    totalSpots: 20,
    bookedSpots: 1,
    judge: {
      name: "Manju Dubey",
      title: "Judge",
      experience: "12+ Years of Experience",
      intro: "Professional Kathak Dancer",
      avatarUrl: "https://picsum.photos/200",
      introVideoUrl: "https://example.com/videos/manju-intro.mp4",
    },
    dates: {
      registerBefore,
      submissionStart,
      submissionEnd,
      resultDate,
    },
    previousWinners: [
      { name: "Riya Shah", position: 1, imageUrl: "https://picsum.photos/seed/picusm/200/400", videoUrl: "https://example.com/v/riya.mp4" },
      { name: "Aarav Mehta", position: 1, imageUrl: "https://picsum.photos/seed/pics/200/400", videoUrl: "https://example.com/v/aarav.mp4" },
      { name: "Neha Verma", position: 2, imageUrl: "https://picsum.photos/seed/dsds/200/400", videoUrl: "https://example.com/v/neha.mp4" },
      { name: "Ishita Chopra", position: 3, imageUrl: "https://picsum.photos/seed/dede/200/400", videoUrl: "https://example.com/v/ishita.mp4" },
    ],
    aboutText:
      "This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance.",
    judgingParameters: "Technique, expression, costume, choreography and overall presentation.",
    rulesAndEligibility:
      "Open to all age groups. One submission per participant. Only entries from paid, registered participants are eligible for judging.",
    rewards: [
      { position: 1, label: "1st Winner", amount: 550 },
      { position: 2, label: "2nd Winner", amount: 300 },
      { position: 3, label: "3rd Winner", amount: 240 },
      { position: 4, label: "4th Winner", amount: 200 },
      { position: 5, label: "5th Winner", amount: 130 },
      { position: 6, label: "6th Winner", amount: 80 },
    ],
    disclaimer: "Only contributions from paid participants will be considered for judging.",
    howPrizeMoneyVideoUrl: "https://example.com/videos/how-to-receive-prize.mp4",
    refundPolicyUrl: "https://feedants.com/refund-policy",
    referral: { baseUrl: "https://feedants.com/r/", rewardPerSignup: 10 },
  });

  console.log("[seed] Sample competition created.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
