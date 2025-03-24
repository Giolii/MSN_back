const prisma = require("../config/prisma");
const { userFields } = require("../utils/sanitizeUser");

const messagesController = {
  async fetchMessages(req, res) {
    const conversationId = req.params.id;
    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID is required" });
    }
    try {
      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
      });
      if (!conversation) {
        return res.status(400).json({ error: "Conversation not found" });
      }

      const userConversation = await prisma.userConversation.findUnique({
        where: {
          userId_conversationId: {
            userId: req.user.id,
            conversationId: conversationId,
          },
        },
      });
      if (!userConversation) {
        return res
          .status(403)
          .json({ error: "You are not part of the conversation" });
      }

      const messages = await prisma.message.findMany({
        where: {
          conversationId,
        },
        include: {
          sender: {
            select: userFields,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return res.status(200).json(messages);
    } catch (error) {
      console.error("Error fetching messages", error);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  },

  async createMessage(req, res) {
    const {
      content,
      conversationId,
      notification = false,
      imageUrl,
    } = req.body;
    if ((!content && !imageUrl) || !conversationId) {
      return res
        .status(400)
        .json({ error: "You need to provide content and conversation ID" });
    }
    try {
      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
      });
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const userConversation = await prisma.userConversation.findUnique({
        where: {
          userId_conversationId: {
            userId: req.user.id,
            conversationId: conversationId,
          },
        },
      });

      if (!userConversation) {
        return res
          .status(403)
          .json({ error: "You are not a participant in this conversation" });
      }

      const message = await prisma.message.create({
        data: {
          content,
          senderId: req.user.id,
          conversationId,
          notification,
          imageUrl,
        },
        include: {
          sender: {
            select: userFields,
          },
        },
      });

      await prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message", error);
      return res.status(500).json({ error: "Failed to create message" });
    }
  },
  async deleteMessage(req, res) {
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: "Message ID is required" });
    }
    try {
      const message = await prisma.message.findUnique({
        where: {
          id: messageId,
        },
      });

      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      if (message.senderId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "You can only delete your own messages" });
      }
      await prisma.message.delete({
        where: {
          id: messageId,
        },
      });
      return res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message", error);
      return res.status(500).json({ error: "Failed to delete message" });
    }
  },

  async editMessage(req, res) {
    const { content, messageId } = req.body;
    if (!content || !messageId) {
      return res
        .status(400)
        .json({ error: "Content and message Id are required" });
    }
    try {
      const message = await prisma.message.findUnique({
        where: {
          id: messageId,
        },
      });
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      if (message.senderId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "You cant only edit your own messages" });
      }
      const editedMessage = await prisma.message.update({
        where: {
          id: messageId,
        },
        data: {
          content,
        },
        include: {
          sender: {
            select: userFields,
          },
        },
      });
      return res.status(200).json(editedMessage);
    } catch (error) {
      console.error("Error editing message", error);
      return res.status(500).json({ error: "Failed to edit message" });
    }
  },
};

module.exports = messagesController;
