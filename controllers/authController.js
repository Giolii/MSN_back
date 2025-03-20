const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const randomAvatar = require("../utils/randomAvatar");
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
          avatar: randomAvatar(),
        },
        select: {
          id: true,
          email: true,
          username: true,
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
      res.json({ user });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error during authentication", error: error.message });
    }
  },
  async checkUsername(req, res) {
    if (!req.params.username) {
      return res.status(400).json({ error: "You need to provide an username" });
    }
    try {
      const user = await prisma.user.findUnique({
        where: {
          username: req.params.username,
        },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(200).json(user);
    } catch (error) {
      res.status(500).json({
        error: "Error during checking username",
      });
    }
  },
  async becomeAdmin(req, res) {
    const { conversationId, participantId } = req.body;
    try {
      if (!conversationId || !participantId) {
        return res.status(400).json({
          error: "You have to provide a conversation ID and a participant ID",
        });
      }

      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        return res
          .status(404)
          .json({ error: "The conversation does not exist" });
      }

      const adminCheck = await prisma.userConversation.findUnique({
        where: {
          userId_conversationId: {
            userId: req.user.id,
            conversationId: conversationId,
          },
        },
      });
      if (!adminCheck || !adminCheck.isAdmin) {
        return res.status(403).json({ error: "Only admins can promote users" });
      }
      const userConversation = await prisma.userConversation.findUnique({
        where: {
          userId_conversationId: {
            userId: participantId,
            conversationId: conversationId,
          },
        },
      });

      if (!userConversation) {
        return res
          .status(404)
          .json({ error: "User is not a participant in this conversation" });
      }

      const result = await prisma.userConversation.update({
        where: {
          userId_conversationId: {
            userId: participantId,
            conversationId: conversationId,
          },
        },
        data: {
          isAdmin: true,
        },
      });
      if (!result) {
        return res
          .status(403)
          .json({ error: "Error looking for the userconversation" });
      }

      return res.status(200).json(conversation);
    } catch (error) {
      console.error("Error updating the user status", error);
      return res
        .status(500)
        .json({ error: "Failed to update the user status" });
    }
  },

  async updateProfile(req, res) {
    const { data } = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const result = await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data,
      });

      if (!result) {
        return res
          .status(400)
          .json({ error: "Error while updating the user informations" });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error updating conversation name", error);
      return res
        .status(500)
        .json({ error: "Failed to update conversation name" });
    }
  },
  async addFriend(req, res) {
    const { friendId } = req.body;
    if (!req.user) {
      return res.status(400).json({ error: "You need to login " });
    }
    if (!friendId) {
      return res
        .status(400)
        .json({ error: "You need to provide your fiend Id" });
    }
    try {
      const addFriend = await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          friends: {
            connect: {
              id: friendId,
            },
          },
        },
      });

      return res.status(200).json(addFriend);
    } catch (error) {
      res.status(500).json({
        error: "Error adding a new friend",
      });
    }
  },
  async allUsers(req, res) {
    const userId = req.user.id;
    try {
      const users = await prisma.user.findMany({
        where: {
          NOT: {
            id: userId,
          },
        },
        orderBy: {
          username: "asc",
        },
      });

      return res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  },
  async removeFriend(req, res) {
    const { friendId } = req.body;
    if (!req.user) {
      return res.status(400).json({ error: "You need to login " });
    }
    if (!friendId) {
      return res
        .status(400)
        .json({ error: "You need to provide your fiend Id" });
    }
    try {
      const addFriend = await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          friends: {
            disconnect: {
              id: friendId,
            },
          },
        },
      });

      return res.status(200).json(addFriend);
    } catch (error) {
      res.status(500).json({
        error: "Error removing friend",
      });
    }
  },
};

module.exports = authController;
