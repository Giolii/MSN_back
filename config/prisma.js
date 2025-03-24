const { PrismaClient } = require("@prisma/client");

const userData = {
  id: true,
  username: true,
  name: true,
  avatar: true,
  email: true,
  createdAt: true,
  aboutMe: true,
};

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

module.exports = prisma;
