// test/auth.test.js
const request = require("supertest");
const { prisma, createTestApp, cleanDatabase } = require("./setup");
const authRoutes = require("../routes/authRoutes");

describe("Auth Controller", () => {
  let app;

  beforeAll(async () => {
    app = createTestApp();
    app.use("/auth", authRoutes);

    // Create a guest user for specific auth tests
    await request(app).post("/auth/register").send({
      email: "guest@guest.com",
      username: "Guest",
      password: "password123",
    });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("POST /auth/register", () => {
    it("should create a new user successfully", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "newuser@example.com",
        username: "newuser",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe("newuser@example.com");
    });

    it("should not allow duplicate emails", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "guest@guest.com",
        username: "differentuser",
        password: "password123",
      });
      expect(response.status).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    it("should authenticate existing users", async () => {
      // Assuming you have a login route that accepts email/password
      const response = await request(app).post("/auth/login").send({
        emailOrUsername: "guest@guest.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("should reject invalid credentials", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "guest@guest.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(400);
    });
  });
});
