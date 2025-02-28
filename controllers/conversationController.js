const { PrismaClient } = require("@prisma/client");
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

const conversationController = {
  // Fetch conversations
  async fetchConv(req, res) {
    try {
      const result = await prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId: req.user.id,
              leftAt: null,
            },
          },
        },
        include: {
          participants: {
            where: {
              leftAt: null,
            },
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
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 50,
      });

      const formattedResult = result.map((conv) => ({
        id: conv.id,
        name: conv.name,
        isGroup: conv.isGroup,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        participants: conv.participants.map((p) => ({
          id: p.user.id,
          username: p.user.username,
          name: p.user.name,
          avatar: p.user.avatar,
          isAdmin: p.isAdmin,
        })),
        latestMessage: conv.messages[0]
          ? {
              content: conv.messages[0].content,
              sender: conv.messages[0].sender.username,
              createdAt: conv.messages[0].createdAt,
            }
          : null,
      }));

      return res.status(200).json(formattedResult);
    } catch (error) {
      console.error("Error fetching conversations", error);
      return res.status(500).json({ error: "Failed to fetch conversations" });
    }
  },

  async fetchSingleConv(req, res) {
    const conversationId = req.params.id;
    if (!conversationId) {
      return res.status(400).json({
        error: "Conversation ID is required",
      });
    }
    try {
      const userConversation = await prisma.userConversation.findUnique({
        where: {
          userId_conversationId: {
            userId: req.user.id,
            conversationId: conversationId,
          },
        },
      });

      if (!userConversation) {
        return res.status(403).json({
          error: "You don't have access to this conversation",
        });
      }
      if (userConversation.leftAt) {
        return res
          .status(400)
          .json({ error: "You have left this conversation" });
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
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 100,
            include: {
              sender: {
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
        return res.status(404).json({
          error: "Conversation not found",
        });
      }

      const formattedConversation = {
        id: conversation.id,
        name: conversation.name,
        isGroup: conversation.isGroup,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        participants: conversation.participants.map((p) => ({
          id: p.user.id,
          username: p.user.username,
          avatar: p.user.avatar,
          isAdmin: p.isAdmin,
          active: p.leftAt === null,
        })),
        messages: conversation.messages
          .map((m) => ({
            id: m.id,
            content: m.content,
            sender: {
              id: m.sender.id,
              username: m.sender.username,
              name: m.sender.name,
              avatar: m.sender.avatar,
            },
            createdAt: m.createdAt,
            isRead: m.isRead,
            readAt: m.readAt,
          }))
          .reverse(),
      };

      return res.status(200).json(formattedConversation);
    } catch (error) {
      console.error("Error fetching single conversation", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch single conversation" });
    }
  },

  // New conversation
  async newConv(req, res) {
    const { name = null, isGroup = false, participants } = req.body;
    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({
        error: "Participants must be provided as an array",
      });
    }

    if (participants.length === 0) {
      return res.status(400).json({
        error: "At least one participant is required",
      });
    }

    if (!isGroup && participants.length !== 1) {
      return res.status(400).json({
        error: "Direct messages must have exactly one participant",
      });
    }

    if (isGroup && participants.length < 2) {
      return res.status(400).json({
        error: "Group chats require at least 2 participants",
      });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const conversation = await tx.conversation.create({
          data: {
            name,
            isGroup,
          },
        });

        await tx.userConversation.createMany({
          data: [[req.user.id], ...participants].flat().map((userId) => ({
            userId,
            conversationId: conversation.id,
            isAdmin: userId === req.user.id && isGroup,
          })),
        });
        return conversation;
      });
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating conversation", error);
      return res.status(500).json({ error: "Failed to create conversation" });
    }
  },

  // Leave conversation
  async leaveConv(req, res) {
    try {
      if (!req.body.conversationId) {
        return res
          .status(400)
          .json({ error: "You have to provide a conversationId" });
      }

      const existingRecord = await prisma.userConversation.findUnique({
        where: {
          userId_conversationId: {
            userId: req.user.id,
            conversationId: req.body.conversationId,
          },
        },
      });

      if (existingRecord?.leftAt) {
        return res
          .status(400)
          .json({ error: "You have already left this conversation" });
      }

      const result = await prisma.userConversation.update({
        where: {
          userId_conversationId: {
            userId: req.user.id,
            conversationId: req.body.conversationId,
          },
        },
        data: {
          leftAt: new Date(),
        },
      });

      return res.status(200).json({ message: "You left the conversation" });
    } catch (error) {
      console.error("Error leaving the conversation", error);
      return res
        .status(500)
        .json({ error: "Failed to leave the conversation" });
    }
  },
  // Add participants
  async addPart(req, res) {
    const { conversationId, usersToAdd } = req.body;

    if (!conversationId) {
      return res
        .status(400)
        .json({ error: "You have to provide a conversationId" });
    }
    if (!usersToAdd || !Array.isArray(usersToAdd) || usersToAdd.length === 0) {
      return res.status(400).json({
        error: "usersToAdd must be a non-empty array of user IDs",
      });
    }

    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (!conversation.isGroup) {
        return res.status(400).json({
          error: "Cannot add participants to a non-group conversation",
        });
      }

      const userConversation = await prisma.userConversation.findFirst({
        where: {
          userId: req.user.id,
          conversationId: conversationId,
          leftAt: null,
        },
      });

      if (!userConversation || !userConversation.isAdmin) {
        return res
          .status(403)
          .json({ error: "Only a memeber admin can add participants" });
      }

      const usersExist = await prisma.user.findMany({
        where: {
          id: { in: usersToAdd },
        },
        select: { id: true },
      });
      if (usersExist.length !== usersToAdd.length) {
        return res.status(400).json({
          error: "One or more users to add do not exist",
        });
      }

      const existingMembers = await prisma.userConversation.findMany({
        where: {
          conversationId: conversationId,
          userId: { in: usersToAdd },
          leftAt: null,
        },
        select: { userId: true },
      });

      const existingMemberIds = existingMembers.map((member) => member.userId);
      const usersToActuallyAdd = usersToAdd.filter(
        (userId) => !existingMemberIds.includes(userId)
      );

      if (usersToActuallyAdd.length === 0) {
        return res.status(400).json({
          error: "All specified users are already in the conversation",
        });
      }

      await prisma.userConversation.createMany({
        data: usersToActuallyAdd.map((userId) => ({
          userId: userId,
          conversationId: conversationId,
          isAdmin: false,
        })),
      });

      return res.status(200).json({ message: "Users added successfully" });
    } catch (error) {
      console.error("Error updating the users of the conversation", error);
      return res
        .status(500)
        .json({ error: "Failed to update users of the conversation" });
    }
  },

  // Remove participants from the conversation

  async removePart(req, res) {
    if (!req.body.partId) {
      return res
        .status(400)
        .json({ error: "You have to provide the participant Id" });
    }
    if (!req.body.conversationId) {
      return res
        .status(400)
        .json({ error: "You have to provide the conversation Id" });
    }

    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: req.body.conversationId },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (!conversation.isGroup) {
        return res.status(400).json({
          error: "Cannot remove participants to a non-group conversation",
        });
      }

      // Check User

      const userConv = await prisma.userConversation.findFirst({
        where: {
          userId: req.user.id,
          conversationId: req.body.conversationId,
          leftAt: null,
        },
      });

      if (!userConv || !userConv.isAdmin) {
        return res
          .status(403)
          .json({ error: "Only admins can add participants" });
      }

      const participantConv = await prisma.userConversation.findUnique({
        where: {
          userId_conversationId: {
            userId: req.body.partId,
            conversationId: req.body.conversationId,
          },
        },
      });

      if (!participantConv) {
        return res
          .status(404)
          .json({ error: "Participant not found in conversation" });
      }

      if (participantConv.leftAt) {
        return res
          .status(400)
          .json({ error: "User has already left the conversation" });
      }

      const result = await prisma.userConversation.update({
        where: {
          userId_conversationId: {
            userId: req.body.partId,
            conversationId: req.body.conversationId,
          },
        },
        data: {
          leftAt: new Date(),
        },
      });
      return res
        .status(200)
        .json({ message: "Participant removed successfully" });
    } catch (error) {
      console.error("Error removing user from the conversation", error);
      return res
        .status(500)
        .json({ error: "Failed to remove users from the conversation" });
    }
  },
};

module.exports = conversationController;
