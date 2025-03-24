const request = require("supertest");
const { createTestApp, createTestUsers, cleanDatabase } = require("./setup");
const messagesRoutes = require("../routes/messageRoutes");

describe("Messages Controller", () => {
  let app, testUsers;

  beforeAll(async () => {
    app = createTestApp();
    app.use("/messages", messagesRoutes);
    testUsers = await createTestUsers();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("POST messages/new", () => {
    it("should create a new message", async () => {
      const response = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "My first message",
          conversationId: testUsers.conversation1.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
    });
    it("should not create message if user is not part of the conversation", async () => {
      const response = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.tokenUserAlone}`)
        .send({
          content: "My first message",
          conversationId: testUsers.conversation1.id,
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
    });
    it("should not create message if no content is provided", async () => {
      const response = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "",
          conversationId: testUsers.conversation1.id,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
    it("should return error if no conversationId is provided", async () => {
      const response = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "content 1234 ",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });
  describe("GET messages/", () => {
    it("should fetch  messages", async () => {
      const message = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "My second message",
          conversationId: testUsers.conversation1.id,
        });

      expect(message.status).toBe(201);
      expect(message.body).toHaveProperty("id");

      const message2 = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token2}`)
        .send({
          content: "My third message",
          conversationId: testUsers.conversation1.id,
        });

      expect(message.status).toBe(201);
      expect(message.body).toHaveProperty("id");

      const response = await request(app)
        .get(`/messages/${testUsers.conversation1.id}`)
        .set("Authorization", `Bearer ${testUsers.token1}`);

      expect(response.status).toBe(200);
      expect(response.body[1].content).toBe(message.body.content);
      expect(response.body[2].content).toBe(message2.body.content);
    });

    it("should return error if user is not in the conversation", async () => {
      const message = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "My fourth message",
          conversationId: testUsers.conversation1.id,
        });

      expect(message.status).toBe(201);
      expect(message.body).toHaveProperty("id");

      const response = await request(app)
        .get(`/messages/${testUsers.conversation1.id}`)
        .set("Authorization", `Bearer ${testUsers.tokenUserAlone}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
    });
  });
  describe("DELETE messages/delete", () => {
    it("should delete the  message", async () => {
      const message = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "Message to delete",
          conversationId: testUsers.conversation1.id,
        });

      expect(message.status).toBe(201);
      expect(message.body).toHaveProperty("id");

      const response = await request(app)
        .delete("/messages/delete")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          messageId: message.body.id,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");

      const messages = await request(app)
        .get(`/messages/${testUsers.conversation1.id}`)
        .set("Authorization", `Bearer ${testUsers.token1}`);

      const deletedMessageExists = messages.body.some(
        (msg) => msg.id === message.body.id
      );
      expect(deletedMessageExists).toBe(false);
    });
    it("should return error if the request is made from another user", async () => {
      const message = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "Message to delete",
          conversationId: testUsers.conversation1.id,
        });

      expect(message.status).toBe(201);
      expect(message.body).toHaveProperty("id");

      const response = await request(app)
        .delete("/messages/delete")
        .set("Authorization", `Bearer ${testUsers.token2}`)
        .send({
          messageId: message.body.id,
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
    });
  });
  describe("PUT messages/edit", () => {
    it("should edit the message", async () => {
      const message = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "Message to edit",
          conversationId: testUsers.conversation1.id,
        });

      expect(message.status).toBe(201);
      expect(message.body).toHaveProperty("id");

      const messageEdited = await request(app)
        .put("/messages/edit")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "Message edited",
          messageId: message.body.id,
        });

      const messages = await request(app)
        .get(`/messages/${testUsers.conversation1.id}`)
        .set("Authorization", `Bearer ${testUsers.token1}`);

      expect(messages.body[messages.body.length - 1].content).toBe(
        messageEdited.body.content
      );
    });
    it("should return error if you try to edit another user comment", async () => {
      const message = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "Message to edit",
          conversationId: testUsers.conversation1.id,
        });

      expect(message.status).toBe(201);
      expect(message.body).toHaveProperty("id");

      const messageEdited = await request(app)
        .put("/messages/edit")
        .set("Authorization", `Bearer ${testUsers.token2}`)
        .send({
          content: "Message edited",
          messageId: message.body.id,
        });

      expect(messageEdited.status).toBe(403);
      expect(messageEdited.body).toHaveProperty("error");
    });
    it("should return error if content is empty", async () => {
      const message = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "Message to edit",
          conversationId: testUsers.conversation1.id,
        });

      expect(message.status).toBe(201);
      expect(message.body).toHaveProperty("id");

      const messageEdited = await request(app)
        .put("/messages/edit")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "",
          messageId: message.body.id,
        });

      expect(messageEdited.body).toHaveProperty("error");
      expect(messageEdited.status).toBe(400);
    });
    it("should return error if message id is empty", async () => {
      const message = await request(app)
        .post("/messages/new")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "Message to edit",
          conversationId: testUsers.conversation1.id,
        });

      expect(message.status).toBe(201);
      expect(message.body).toHaveProperty("id");

      const messageEdited = await request(app)
        .put("/messages/edit")
        .set("Authorization", `Bearer ${testUsers.token1}`)
        .send({
          content: "my new content",
          messageId: "",
        });

      expect(messageEdited.body).toHaveProperty("error");
      expect(messageEdited.status).toBe(400);
    });
  });
});
