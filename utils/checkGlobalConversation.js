const prisma = require("../config/prisma");
const { randomGroupAvatar } = require("./randomAvatar");

const checkGlobalConversation = async (user) => {
  const globalConversation = await prisma.conversation.findUnique({
    where: {
      id: "12345",
    },
  });

  if (!globalConversation) {
    await prisma.conversation.create({
      data: {
        id: "12345",
        name: "Global Conversation",
        isGroup: true,
        groupAvatar: randomGroupAvatar(),
      },
    });

    await prisma.userConversation.create({
      data: {
        userId: user.id,
        conversationId: "12345",
        isAdmin: true,
      },
    });
  } else {
    const joinGlobalConversation = await prisma.userConversation.create({
      data: {
        userId: user.id,
        conversationId: "12345",
      },
    });
  }
};

module.exports = checkGlobalConversation;
