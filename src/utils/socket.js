import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import express from "express";

dotenv.config();
const app = express();
const server = http.createServer(app);
const origin = process.env.NODE_ENV === "production" ? process.env.CORS_ORIGIN : "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: [origin],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store online users
export const userSocketMap = {}; // {userId: socketId}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const userId = socket.handshake.query.authUser;
  
  if (userId) {
    // Add user to userSocketMap
    userSocketMap[userId] = socket.id;
    console.log(userSocketMap)
    console.log("Connected User ID:", userId);
    console.log("Current Online Users:", Object.keys(userSocketMap));

    // Emit updated online users to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    // Remove user from userSocketMap
    if (userId) {
      delete userSocketMap[userId];
    }

    // Emit updated online users to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    console.log("Updated Online Users:", Object.keys(userSocketMap));
  });
});

export { io, app, server };
