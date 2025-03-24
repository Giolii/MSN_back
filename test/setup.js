const { PrismaClient } = require("@prisma/client");
const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  require("../config/passport");
  app.use(passport.initialize());
  return app;
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET);
};

const cleanDatabase = async () => {
  await prisma.message.deleteMany({});
  await prisma.userConversation.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.user.deleteMany({});
};

const createTestUsers = async () => {
  const user1 = await prisma.user.create({
    data: {
      email: "test1@example.com",
      username: "testuser1",
      password: "password123", // In a real app, hash this
    },
  });
  const user2 = await prisma.user.create({
    data: {
      email: "test2@example.com",
      username: "testuser2",
      password: "password123",
    },
  });
  const user3 = await prisma.user.create({
    data: {
      email: "test3@example.com",
      username: "testuser3",
      password: "password123",
    },
  });
  const userNotInConversation = await prisma.user.create({
    data: {
      email: "not@email.com",
      username: "notSocial",
      password: "notpsw1990",
    },
  });
  const conversation1 = await prisma.conversation.create({ data: {} });
  const userConversation1 = await prisma.userConversation.create({
    data: {
      userId: user1.id,
      conversationId: conversation1.id,
    },
  });
  const userConversation2 = await prisma.userConversation.create({
    data: {
      userId: user2.id,
      conversationId: conversation1.id,
    },
  });

  return {
    conversation1,
    user1,
    user2,
    user3,
    userNotInConversation,
    token1: generateToken(user1.id),
    token2: generateToken(user2.id),
    token3: generateToken(user3.id),
    tokenUserAlone: generateToken(userNotInConversation.id),
  };
};

beforeAll(async () => {
  // Make sure we're using the test database
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL environment variable is not set");
  }
  if (process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL cannot be the same as DATABASE_URL");
  }

  // Clean database before all tests
  await cleanDatabase();
});

afterAll(async () => {
  // Clean up and disconnect after all tests
  await cleanDatabase();
  await prisma.$disconnect();
});

module.exports = {
  prisma,
  createTestApp,
  generateToken,
  cleanDatabase,
  createTestUsers,
};
