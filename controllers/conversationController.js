const prisma = require("../config/prisma");

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
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 50,
      });

      return res.status(200).json(result);
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
                  email: true,
                  createdAt: true,
                  aboutMe: true,
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

      return res.status(200).json(conversation);
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

    if (isGroup && !name.trim()) {
      return res.status(400).json({
        error: "The group need a name",
      });
    }
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
      // Check for an existing coversation between 2 users
      if (participants.length === 1) {
        const existingConversation = await prisma.conversation.findFirst({
          where: {
            isGroup: false,
            participants: {
              every: {
                userId: {
                  in: [req.user.id, participants[0]],
                },
                leftAt: null,
              },
            },
          },
          include: {
            participants: true, // Add this if you need participant details
          },
        });
        // Does work the left at implementation?
        if (existingConversation) {
          return res.status(403).json({
            error: "The conversation with the user already exists",
          });
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const conversation = await tx.conversation.create({
          data: {
            // name: participants.length === 1 ? participants[0].username : name,
            name: name,
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
        return tx.conversation.findUnique({
          where: {
            id: conversation.id,
          },
          include: {
            participants: {
              where: { leftAt: null },
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

      const conversation = await prisma.conversation.findUnique({
        where: {
          id: req.body.conversationId,
        },
      });
      if (!conversation) {
        return res
          .status(400)
          .json({ error: "THis conversation doesn't exist" });
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

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error leaving the conversation", error);
      return res
        .status(500)
        .json({ error: "Failed to leave the conversation" });
    }
  },

  // Mistake, already had one with same thing
  async removeUser(req, res) {
    const { conversationId, userToRemove } = req.body;
    try {
      if (!conversationId || !userToRemove) {
        return res
          .status(400)
          .json({ error: "You have to provide a conversationId and a user" });
      }

      const existingRecord = await prisma.userConversation.findUnique({
        where: {
          userId_conversationId: {
            userId: userToRemove.id,
            conversationId: req.body.conversationId,
          },
        },
      });

      if (existingRecord?.leftAt) {
        return res.status(400).json({ error: "You removed already this user" });
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
        return res.status(403).json({ error: "Only admins can remove users" });
      }

      const result = await prisma.userConversation.update({
        where: {
          userId_conversationId: {
            userId: userToRemove.id,
            conversationId: conversationId,
          },
        },
        data: {
          leftAt: new Date(),
        },
      });

      return res.status(200).json(result);
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
          .json({ error: "Only admins can remove participants" });
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
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error removing user from the conversation", error);
      return res
        .status(500)
        .json({ error: "Failed to remove users from the conversation" });
    }
  },

  async editConvName(req, res) {
    const { conversationId, groupName } = req.body;
    if (!conversationId || !groupName.trim()) {
      return res
        .status(400)
        .json({ error: "You need to provide ConversationId and new Name" });
    }

    if (groupName.trim().length > 100) {
      // Set reasonable max length
      return res.status(400).json({
        error: "Conversation name cannot exceed 100 characters",
      });
    }
    try {
      const userConversation = await prisma.userConversation.findUnique({
        where: {
          userId_conversationId: {
            // Using the composite unique constraint
            userId: req.user.id,
            conversationId: conversationId,
          },
        },
      });

      if (!userConversation) {
        return res
          .status(404)
          .json({ error: "You are not part of this conversation" });
      }
      if (!userConversation.isAdmin) {
        return res.status(403).json({ error: "You are not an admin" });
      }

      const conversation = await prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          name: groupName,
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
        return res.status(400).json({ error: "Conversation not found" });
      }

      return res.status(200).json(conversation);
    } catch (error) {
      console.error("Error updating conversation name", error);
      return res
        .status(500)
        .json({ error: "Failed to update conversation name" });
    }
  },
};

module.exports = conversationController;
