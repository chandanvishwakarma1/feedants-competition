/**
 * End-to-end API test. Run with the backend already running:
 *   (PowerShell)  $env:DISABLE_RATE_LIMIT="true"; npm run dev      <- terminal 1
 *   npm run test:smoke                                              <- terminal 2
 * Afterwards run `npm run phase -- login` to reset the competition to a clean state.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Competition = require("../src/models/Competition");

const BASE = process.env.API_URL || "http://localhost:5000/api";
const DAY = 24 * 60 * 60 * 1000;
let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  ok ? passed++ : failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? "  -> " + detail : ""}`);
}

async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  return { status: res.status, data };
}

let counter = 0;
async function makeUser() {
  const email = `t_${Date.now()}_${counter++}@test.com`;
  const r = await api("/auth/register", { method: "POST", body: { name: "Test User", email, password: "password123" } });
  return { email, token: r.data && r.data.token };
}

const setDates = (id, d, extra = {}) => Competition.updateOne({ _id: id }, { $set: { dates: d, ...extra } });
const from = (now, { reg, subStart, subEnd, result }) => ({
  registerBefore: new Date(now + reg * DAY),
  submissionStart: new Date(now + subStart * DAY),
  submissionEnd: new Date(now + subEnd * DAY),
  resultDate: new Date(now + result * DAY),
});

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const list = await api("/competitions");
  if (!list.data || !list.data.length) throw new Error("No competition found. Run `npm run seed` first.");
  const id = list.data[0].id;
  const get = (token) => api(`/competitions/${id}`, { token });
  const now = Date.now();

  // Known starting state: registration open, 20 spots, 1 booked
  await setDates(id, from(now, { reg: 2, subStart: 5, subEnd: 20, result: 25 }), { bookedSpots: 1, totalSpots: 20 });

  console.log("\n== Auth validation ==");
  const bad = (body) => api("/auth/register", { method: "POST", body });
  check("rejects 1-char name", (await bad({ name: "A", email: "a@b.com", password: "password123" })).status === 400);
  check("rejects invalid email", (await bad({ name: "Alice", email: "nope", password: "password123" })).status === 400);
  check("rejects short password", (await bad({ name: "Alice", email: "a@b.com", password: "short" })).status === 400);
  const u1 = await makeUser();
  check("registers a valid user and returns a token", !!u1.token);
  check("rejects duplicate email (409)", (await bad({ name: "Dup", email: u1.email, password: "password123" })).status === 409);
  check("rejects wrong password (401)", (await api("/auth/login", { method: "POST", body: { email: u1.email, password: "wrongpass1" } })).status === 401);
  check("logs in with correct password", !!((await api("/auth/login", { method: "POST", body: { email: u1.email, password: "password123" } })).data || {}).token);

  console.log("\n== Reading a competition ==");
  let r = await get();
  check("anonymous: userState=anonymous, CTA=login", r.data.userState === "anonymous" && r.data.cta.action === "login");
  check("phase is upcoming", r.data.phase === "upcoming");
  check("spotsLeft is 19", r.data.spotsLeft === 19, `got ${r.data.spotsLeft}`);
  check("referral link + reward present", !!(r.data.referral && r.data.referral.link) && r.data.referral.rewardPerSignup > 0);
  r = await get(u1.token);
  check("logged in: not_registered, CTA=register", r.data.userState === "not_registered" && r.data.cta.action === "register");
  check("invalid id -> 400", (await api("/competitions/not-an-id")).status === 400);
  check("unknown id -> 404", (await api("/competitions/000000000000000000000000")).status === 404);

  console.log("\n== Registration ==");
  check("register without token -> 401", (await api(`/competitions/${id}/register`, { method: "POST" })).status === 401);
  r = await api(`/competitions/${id}/register`, { method: "POST", token: u1.token });
  check("register succeeds (201)", r.status === 201, JSON.stringify(r.data));
  check("spotsLeft dropped to 18, CTA disabled", r.data.competition.spotsLeft === 18 && r.data.competition.cta.enabled === false);
  r = await api(`/competitions/${id}/register`, { method: "POST", token: u1.token });
  check("registering twice -> 409", r.status === 409);
  check("duplicate did not consume a spot", (await get(u1.token)).data.spotsLeft === 18);

  console.log("\n== Submission rules ==");
  const body = { mediaUrl: "https://example.com/a.mp4" };
  check("submit before window opens -> 409", (await api(`/competitions/${id}/submit`, { method: "POST", token: u1.token, body })).status === 409);
  await setDates(id, from(now, { reg: -1, subStart: -0.1, subEnd: 10, result: 15 }));
  r = await get(u1.token);
  check("phase submission_open, CTA=upload", r.data.phase === "submission_open" && r.data.cta.action === "upload");
  check("anonymous in submission phase: CTA=login", (await get()).data.cta.action === "login");
  check("submit without mediaUrl -> 400", (await api(`/competitions/${id}/submit`, { method: "POST", token: u1.token, body: {} })).status === 400);
  const u2 = await makeUser();
  r = await get(u2.token);
  check("logged in but unregistered: CTA disabled", r.data.userState === "not_registered" && r.data.cta.enabled === false);
  check("unregistered user cannot submit (403)", (await api(`/competitions/${id}/submit`, { method: "POST", token: u2.token, body })).status === 403);
  check("registering after the deadline -> 409", (await api(`/competitions/${id}/register`, { method: "POST", token: u2.token })).status === 409);
  check("registered user can submit", (await api(`/competitions/${id}/submit`, { method: "POST", token: u1.token, body })).status === 200);
  r = await get(u1.token);
  check("after submitting: userState=submitted", r.data.userState === "submitted" && r.data.hasSubmitted === true);
  check("after submitting: CTA is disabled", r.data.cta.enabled === false);

  console.log("\n== Lifecycle phases ==");
  await setDates(id, from(now, { reg: -2, subStart: 3, subEnd: 20, result: 25 }));
  check("registration_closed", (await get(u1.token)).data.phase === "registration_closed");
  await setDates(id, from(now, { reg: -20, subStart: -15, subEnd: -1, result: 5 }));
  check("judging", (await get(u1.token)).data.phase === "judging");
  await setDates(id, from(now, { reg: -20, subStart: -15, subEnd: -5, result: -1 }));
  r = await get(u1.token);
  check("results_declared, CTA=view_results", r.data.phase === "results_declared" && r.data.cta.action === "view_results");
  await setDates(id, from(now, { reg: 2, subStart: 5, subEnd: 20, result: 25 }), { bookedSpots: 20, totalSpots: 20 });
  r = await get(u1.token);
  check("spots full before deadline -> registration_closed", r.data.phase === "registration_closed" && r.data.spotsLeft === 0);

  console.log("\n== Concurrency ==");
  await Competition.updateOne({ _id: id }, { $set: { bookedSpots: 19 } }); // exactly 1 spot left
  const racers = await Promise.all(Array.from({ length: 30 }, makeUser));
  const results = await Promise.all(racers.map((u) => api(`/competitions/${id}/register`, { method: "POST", token: u.token })));
  const wins = results.filter((x) => x.status === 201).length;
  const limited = results.filter((x) => x.status === 429).length;
  check("30 users race for 1 spot: exactly 1 wins", wins === 1, `wins=${wins}`);
  check("nobody was rate-limited (start server with DISABLE_RATE_LIMIT=true)", limited === 0, `429s=${limited}`);
  check("bookedSpots never exceeds totalSpots", (await Competition.findById(id)).bookedSpots === 20);

  await Competition.updateOne({ _id: id }, { $set: { bookedSpots: 5 } });
  const tapper = await makeUser();
  const taps = await Promise.all(Array.from({ length: 5 }, () => api(`/competitions/${id}/register`, { method: "POST", token: tapper.token })));
  check("same user double-tapping 5x: exactly 1 succeeds", taps.filter((x) => x.status === 201).length === 1);
  check("...and consumes exactly one spot (rollback works)", (await Competition.findById(id)).bookedSpots === 6, `bookedSpots=${(await Competition.findById(id)).bookedSpots}`);

  console.log(`\n${passed} passed, ${failed} failed. Run \`npm run phase -- login\` to reset the sample data.`);
  await mongoose.connection.close();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });