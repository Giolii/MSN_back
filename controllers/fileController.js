const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

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

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const fileController = {
  async fileUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const userId = req.user.id;

      const fileExtension = path.extname(req.file.originalname);
      const fileName = `avatars/${userId}/${uuidv4()}${fileExtension}`;

      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      // Generate the permanent S3 URL (public through bucket policy)
      const avatarUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
      });

      return res.status(200).json({
        message: "Avatar updated successfully",
        user: {
          id: updatedUser.id,
          avatar: updatedUser.avatar,
        },
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      return res.status(500).json({ message: "Failed to upload avatar" });
    }
  },

  async imageUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const userId = req.user.id;

      const fileExtension = path.extname(req.file.originalname);
      const fileName = `avatars/${userId}/${uuidv4()}${fileExtension}`;

      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      // Generate the permanent S3 URL (public through bucket policy)
      const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      return res.status(200).json(imageUrl);
    } catch (error) {
      console.error("Image upload error:", error);
      return res.status(500).json({ message: "Failed to upload Image" });
    }
  },
};

module.exports = fileController;
