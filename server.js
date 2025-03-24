require("dotenv").config();
const express = require("express");
const passport = require("passport");
const cors = require("cors");

const app = express();
const port = process.env.PORT;
const authRoutes = require("./routes/authRoutes");
const convRoutes = require("./routes/convRoutes");
const messagesRoutes = require("./routes/messageRoutes");
const fileRoutes = require("./routes/fileRoutes");

require("./config/passport");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(passport.initialize());
const corsOptions = {
  origin: [
    process.env.VITE_FRONTEND_URL,
    process.env.VITE_FRONTEND_URL2,
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
};
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/auth", authRoutes);
app.use("/conv", convRoutes);
app.use("/messages", messagesRoutes);
app.use("/files", fileRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.stack);
  res
    .status(statusCode)
    .json({
      error:
        process.env.NODE_ENV === "production" ? "Server error" : err.message,
    });
  res.status(500).send(`Server error`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
