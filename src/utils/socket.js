import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import express from "express";
import Friend from "../models/friend.model.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
const origin = process.env.NODE_ENV === "production" ? process.env.CORS_ORIGIN : "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: [origin],
  },
});

// used to store online users
export const userSocketMap = {}; // {userId: socketId}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", async (socket) => {
  console.log("A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
      userSocketMap[userId] = socket.id;

      // Debugging the user and their friends
      console.log("Connected User ID:", userId);
      // console.log("Current Online Users:", Object.keys(userSocketMap));

      try {
          const friends = await Friend.find({ user: userId }).populate("friend", "_id");
          // console.log("Friends from DB:", friends);

          const friendIds = friends.map((friend) => friend.friend._id.toString());
          const onlineFriends = Object.keys(userSocketMap).filter((id) => friendIds.includes(id));

          console.log("Online Friends:", onlineFriends);
          socket.emit("getOnlineUsers", onlineFriends); // Emit to the connected user
      } catch (err) {
          console.error("Error fetching friends:", err.message);
          socket.emit("error", { message: "Failed to fetch online friends" });
      }
  }

  socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
      delete userSocketMap[userId];
      console.log("Updated Online Users:", Object.keys(userSocketMap));
  });
});


export { io, app, server };
