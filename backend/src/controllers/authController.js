const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler, AppError } = require("../utils/asyncHandler");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function validateCredentials({ name, email, password }, { requireName = false } = {}) {
  if (requireName && (!name || !name.trim())) {
    throw new AppError("Name is required.", 400);
  }
  if (requireName && name.trim().length < 2) {
    throw new AppError("Name must be at least 2 characters.", 400);
  }

  if (!email || !email.trim()) {
    throw new AppError("Email is required.", 400);
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    throw new AppError("Enter a valid email address.", 400);
  }

  if (!password) {
    throw new AppError("Password is required.", 400);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 400);
  }
}

// POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  validateCredentials({ name, email, password }, { requireName: true });

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new AppError("An account with this email already exists.", 409);

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });

  const token = signToken(user._id);
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

// POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  validateCredentials({ email, password });

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new AppError("Invalid credentials.", 401);

  const match = await user.comparePassword(password);
  if (!match) throw new AppError("Invalid credentials.", 401);

  const token = signToken(user._id);
  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

module.exports = { registerUser, loginUser };