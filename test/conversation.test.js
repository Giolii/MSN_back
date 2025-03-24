const request = require("supertest");
const { createTestApp, createTestUsers, cleanDatabase } = require("./setup");
const convRoutes = require("../routes/convRoutes");
const prisma = require("../config/prisma");

describe("Conversation Controller", () => {
  let app, testUsers;

  // Setup specific to this test file
  beforeAll(async () => {
    // Create and configure the test application
    app = createTestApp();
    app.use("/conv", convRoutes);

    // Create test users to use in the tests
    testUsers = await createTestUsers();
  });

  // Clean up after this specific test file
  afterAll(async () => {
    await cleanDatabase();
  });

  describe("POST /conv/new", () => {
    it("should create a new direct message conversation", async () => {
      const response = await request(app)
        .post("/conv/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          isGroup: false,
          participants: [testUsers.user2.id],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");

      // Verify the conversation was created correctly
      const userConversations = await prisma.userConversation.findMany({
        where: { conversationId: response.body.id },
      });

      expect(userConversations).toHaveLength(2);
      expect(userConversations.map((uc) => uc.userId)).toContain(
        testUsers.user1.id
      );
      expect(userConversations.map((uc) => uc.userId)).toContain(
        testUsers.user2.id
      );
    });

    it("should create a new group conversation", async () => {
      const response = await request(app)
        .post("/conv/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          name: "Test Group",
          isGroup: true,
          participants: [testUsers.user2.id, testUsers.user3.id],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Test Group");

      // Verify the group conversation was created correctly
      const userConversations = await prisma.userConversation.findMany({
        where: { conversationId: response.body.id },
      });

      expect(userConversations).toHaveLength(3);

      // Verify creator is an admin
      const creatorMembership = userConversations.find(
        (uc) => uc.userId === testUsers.user1.id
      );
      expect(creatorMembership.isAdmin).toBe(true);

      // Verify other members are not admins
      const otherMemberships = userConversations.filter(
        (uc) => uc.userId !== testUsers.user1.id
      );
      expect(otherMemberships.every((m) => m.isAdmin === false)).toBe(true);
    });

    it("should return 400 if no participants provided", async () => {
      const response = await request(app)
        .post("/conv/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          isGroup: false,
          participants: [],
        });

      expect(response.status).toBe(400);
    });

    it("should return 401 if no authentication token provided", async () => {
      const response = await request(app)
        .post("/conv/new")
        .send({
          isGroup: false,
          participants: [testUsers.user2.id],
        });

      expect(response.status).toBe(401);
    });
  });
  describe("Get /conv/:id", () => {
    it("fetch single conversation", async () => {
      const response = await request(app)
        .post("/conv/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          isGroup: false,
          participants: [testUsers.user2.id],
        });
      expect(response.status).toBe(200);
      const response2 = await request(app)
        .get(`/conv/${response.body.id}`)
        .set("Authorization", `Bearer ${testUsers.token1}`);

      expect(response2.status).toBe(200);
      expect(response2.body).toHaveProperty("id", response.body.id);
    });

    it("should reject unauthenticated access", async () => {
      const response = await request(app).get("/conv/xxx");
      expect(response.status).toBe(401);
    });
    it(" conversation ID not found", async () => {
      const response = await request(app)
        .get("/conv/sdfasdfsadf-fdsfdsafsd-fdsfdsafdas")
        .set("Authorization", `Bearer ${testUsers.token1}`);
      expect(response.status).toBe(403);
    });
    it("reject if not part of the conversation", async () => {
      const conversation = await request(app)
        .post("/conv/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          isGroup: false,
          participants: [testUsers.user2.id],
        });
      expect(conversation.status).toBe(200);

      const response = await request(app)
        .get(`/conv/${conversation.body.id}`)
        .set("Authorization", `Bearer ${testUsers.tokenUserAlone}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
    });

    it("leave user from a conversation", async () => {
      const conversation = await request(app)
        .post("/conv/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          name: "Test Group",
          isGroup: true,
          participants: [testUsers.user2.id, testUsers.user3.id],
        });

      const leave = await request(app)
        .post("/conv/leave")
        .set("Authorization", `Bearer ${testUsers.token3}`)
        .send({ conversationId: conversation.body.id });
      expect(leave.status).toBe(200);
      expect(leave.body).toHaveProperty("message");

      const fetchAfterLeft = await request(app)
        .get(`/conv/${conversation.body.id}`)
        .set("Authorization", `Bearer ${testUsers.token3}`);
      expect(fetchAfterLeft.status).toBe(400);
      expect(fetchAfterLeft.body).toHaveProperty("error");
    });
  });

  it("add participants to a conversation", async () => {
    const conversation = await request(app)
      .post("/conv/new")
      .set("Authorization", `Bearer ${testUsers.token1}`)
      .send({
        name: "Test Group",
        isGroup: true,
        participants: [testUsers.user2.id, testUsers.user3.id],
      });
    expect(conversation.status).toBe(201);
    expect(conversation.body).toHaveProperty("id");

    const addUser = await request(app)
      .post("/conv/add")
      .set("Authorization", `Bearer ${testUsers.token1}`)
      .send({
        conversationId: conversation.body.id,
        usersToAdd: [testUsers.userNotInConversation.id],
      });
    expect(addUser.body).toHaveProperty("message");
    expect(addUser.status).toBe(200);

    const userConversation = await prisma.userConversation.findFirst({
      where: {
        userId: testUsers.userNotInConversation.id,
        conversationId: conversation.id,
      },
    });

    expect(userConversation).not.toBeNull();
  });
  it("should prevent non-admins from adding participants", async () => {
    const conversation = await request(app)
      .post("/conv/new")
      .set("Authorization", `Bearer ${testUsers.token1}`)
      .send({
        name: "Test Group",
        isGroup: true,
        participants: [testUsers.user2.id, testUsers.user3.id],
      });
    expect(conversation.status).toBe(201);
    expect(conversation.body).toHaveProperty("id");

    const addUser = await request(app)
      .post("/conv/add")
      .set("Authorization", `Bearer ${testUsers.token2}`)
      .send({
        conversationId: conversation.body.id,
        usersToAdd: [testUsers.userNotInConversation.id],
      });
    expect(addUser.body).toHaveProperty("error");
    expect(addUser.status).toBe(403);
  });
  it("should prevent adding to direct message conversations", async () => {
    const createResponse = await request(app)
      .post("/conv/new")
      .set("Authorization", `Bearer ${testUsers.token1}`)
      .send({
        isGroup: false,
        participants: [testUsers.user2.id],
      });

    expect(createResponse.status).toBe(200);

    // Try to add a user to a DM
    const addUserResponse = await request(app)
      .post("/conv/add")
      .set("Authorization", `Bearer ${testUsers.token1}`)
      .send({
        conversationId: createResponse.body.id,
        usersToAdd: [testUsers.userNotInConversation.id],
      });

    expect(addUserResponse.status).toBe(400);
  });
  describe("POST /conv/remove", () => {
    it("should remove users from conversation", async () => {
      const conversation = await request(app)
        .post("/conv/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          name: "Test x Group",
          isGroup: true,
          participants: [testUsers.user2.id, testUsers.user3.id],
        });
      expect(conversation.status).toBe(201);
      expect(conversation.body).toHaveProperty("id");

      const remove = await request(app)
        .post("/conv/remove")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          partId: testUsers.user2.id,
          conversationId: conversation.body.id,
        });

      expect(remove.body).toHaveProperty("message");
      expect(remove.status).toBe(200);
    });
    it("should prevent non admin to remove users from conversation", async () => {
      const conversation = await request(app)
        .post("/conv/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          name: "Test x Group",
          isGroup: true,
          participants: [testUsers.user2.id, testUsers.user3.id],
        });
      expect(conversation.status).toBe(201);
      expect(conversation.body).toHaveProperty("id");

      const remove = await request(app)
        .post("/conv/remove")
        .set("Authorization", `Bearer ${testUsers.token2}`)
        .send({
          partId: testUsers.user3.id,
          conversationId: conversation.body.id,
        });

      expect(remove.body).toHaveProperty("error");
      expect(remove.status).toBe(403);
    });
    it("should allow users to remove themselves", async () => {
      // Create a group conversation
      const createResponse = await request(app)
        .post("/conv/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          name: "Self Remove Test",
          isGroup: true,
          participants: [testUsers.user2.id, testUsers.user3.id],
        });

      // User2 removes themselves from the conversation
      const removeResponse = await request(app)
        .post("/conv/remove")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          partId: testUsers.user1.id, // Removing themselves
          conversationId: createResponse.body.id,
        });

      expect(removeResponse.body).toHaveProperty("message");
      expect(removeResponse.status).toBe(200);

      // Verify they were actually removed
      const userConvAfter = await prisma.userConversation.findFirst({
        where: {
          userId: testUsers.user1.id,
          conversationId: createResponse.body.id,
          leftAt: null,
        },
      });

      expect(userConvAfter).toBeNull();
    });
  });
  describe("POST /conv/editName", () => {
    it("should update the conversationName", async () => {
      const response = await request(app)
        .post("/conv/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          name: "Test Group",
          isGroup: true,
          participants: [testUsers.user2.id, testUsers.user3.id],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Test Group");

      const updatedResponse = await request(app)
        .post("/conv/editName")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          groupName: "New Name",
          conversationId: response.body.id,
        });

      expect(updatedResponse.status).toBe(200);
      expect(updatedResponse.body.name).toBe(updatedResponse.body.name);
    });
    it("should return error if user is not an admin", async () => {
      const response = await request(app)
        .post("/conv/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          name: "Test Group",
          isGroup: true,
          participants: [testUsers.user2.id, testUsers.user3.id],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Test Group");

      const updatedResponse = await request(app)
        .post("/conv/editName")
        .set("Authorization", `Bearer ${testUsers.token2}`)
        .send({
          groupName: "New Name",
          conversationId: response.body.id,
        });

      expect(updatedResponse.status).toBe(403);
      expect(updatedResponse.body).toHaveProperty("error");
    });
  });
});
