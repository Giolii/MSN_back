const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Guest account?

async function ensureGlobalConversationExists() {
  try {
    // Check if global conversation with ID "1" already exists
    const existingConversation = await prisma.conversation.findUnique({
      where: { id: "1" },
    });

    // If it doesn't exist, create it
    if (!existingConversation) {
      console.log('Creating global conversation with ID "1"...');

      const globalConversation = await prisma.conversation.create({
        data: {
          id: "1", // Force ID to be "1"
          name: "Global Conversation",
          isGroup: true,
        },
      });

      console.log("Global conversation created:", globalConversation);
      return globalConversation;
    } else {
      console.log("Global conversation already exists");
      return existingConversation;
    }
  } catch (error) {
    console.error("Error ensuring global conversation exists:", error);
    throw error;
  }
}
ensureGlobalConversationExists();
