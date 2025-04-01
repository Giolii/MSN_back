const prisma = require("../config/prisma");
const { userFields } = require("../utils/sanitizeUser");

const userController = {
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
        select: userFields,
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
        select: userFields,
      });

      return res.status(200).json(addFriend);
    } catch (error) {
      res.status(500).json({
        error: "Error removing friend",
      });
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
        select: userFields,
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
        .json({ error: "You need to provide your friend Id" });
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
        select: userFields,
      });

      return res.status(200).json(addFriend);
    } catch (error) {
      res.status(500).json({
        error: "Error adding a new friend",
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
};

module.exports = userController;
