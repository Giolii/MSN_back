const request = require("supertest");
const { createTestApp, cleanDatabase, createTestUsers } = require("./setup");
const authRoutes = require("../routes/authRoutes");

describe("Auth Controller", () => {
  let app;
  let testUsers;

  beforeAll(async () => {
    app = createTestApp();
    app.use("/auth", authRoutes);
    testUsers = await createTestUsers();

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
        email: "guest@guest.com",
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

      expect(response.status).toBe(401);
    });
  });
  describe("GET /auth/me", () => {
    it("should check user token", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${testUsers.tokenUserAlone}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
    });
    it("should return error if token is wrong", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${testUsers.tokenUserAlone + "XYZ"}`);

      expect(response.status).toBe(401);
    });
  });
  describe("GET /auth/:username", () => {
    it("should check username if it exists", async () => {
      const response = await request(app)
        .get(`/auth/${testUsers.user1.username}`)
        .set("Authorization", `Bearer ${testUsers.token2}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("username");
      expect(response.body.username).toBe(testUsers.user1.username);
    });
    it("should retunr error if username doesnt exist", async () => {
      const response = await request(app)
        .get(`/auth/hjgdfskajghsdajgfajshgdfajfjgdsah`)
        .set("Authorization", `Bearer ${testUsers.token2}`);

      expect(response.status).toBe(404);
      expect(response.body).not.toHaveProperty("username");
    });
  });
});
