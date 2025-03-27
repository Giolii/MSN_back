const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { randomAvatar } = require("../utils/randomAvatar");
const prisma = require("../config/prisma");
const { sanitizeUser } = require("../utils/sanitizeUser");

const authController = {
  // Sign Up
  async signup(req, res) {
    try {
      const { email, username, password } = req.body;
      if (!email?.trim() || !username?.trim() || !password?.trim()) {
        return res.status(400).json({
          error: "All fields are required",
        });
      }
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username,
          password: hashedPassword,
          avatar: randomAvatar(),
        },
      });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      const globalConversation = await prisma.userConversation.create({
        data: {
          userId: user.id,
          conversationId: "1",
        },
      });

      return res.status(201).json({
        user: sanitizeUser(user),
        token,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Error while signing up",
        error: error.message,
      });
    }
  },

  // Login - email works for email or username
  async login(req, res) {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        error: "Email/Username and password are required",
      });
    }
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: email }, { username: email }],
        },
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: "Password doesn't match" });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        message: "Login successful",
        token,
        user: sanitizeUser(user),
      });
    } catch (error) {
      res.status(500).json({ error: "Error logging in", error: error.message });
    }
  },

  // Guest
  async guest(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          username: "Guest",
        },
      });
      if (!user) {
        return res.status(401).json({ error: "Guest not found" });
      }
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: "Login successful",
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      res.status(500).json({ error: "Error logging in", error: error.message });
    }
  },
  async authenticateMe(req, res) {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user found in request" });
    }
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
        include: {
          friends: true,
        },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error during authentication", error: error.message });
    }
  },
};

module.exports = authController;
