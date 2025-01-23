import express from "express";
import {
  createGroup,
  sendGroupMessage,
  getGroupsForUser,
  getGroupMessages,
} from "../controllers/group.controller.js";
// import { sendMessage } from "../controllers/messageController.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

// router.route("/").post(verifyJWT, accessChat).get(verifyJWT, fetchChats);
router.route("/create-group").post(verifyJWT, createGroup);
router.route("/get-groups").get(verifyJWT, getGroupsForUser);
router.route("/send-messages/:groupId").post(verifyJWT, sendGroupMessage);
// router.route("/message").post(verifyJWT, sendMessage);
router.route("/:groupId/messages")
  .get(verifyJWT, getGroupMessages);
export default router;