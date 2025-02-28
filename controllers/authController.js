const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const databaseUrl =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

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
        },
        select: {
          id: true,
          email: true,
          username: true,
        },
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.status(201).json({
        user,
        token,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Error while signing up",
        error: error.message,
      });
    }
  },

  // Login
  async login(req, res) {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername?.trim() || !password?.trim()) {
      return res.status(400).json({
        error: "Email/Username and password are required",
      });
    }
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
        },
      });

      if (!user) {
        return res
          .status(401)
          .json({ error: "Invalid credentials, user not found" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res
          .status(401)
          .json({ error: "Invalid credentials, password doesn't match" });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        message: "Login successful",
        token,
        user,
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
      res.json({
        message: "Login successful",
        token,
        user,
      });
    } catch (error) {
      res.status(500).json({ error: "Error logging in", error: error.message });
    }
  },
};

module.exports = authController;
