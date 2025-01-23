import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
// {createGroup,sendGroupMessage,getGroupsForUser}
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import {io,getReceiverSocketId} from "../utils/socket.js"
import cloudinary from "../utils/cloudinary.js";
import {io,getReceiverSocketId} from "../utils/socket.js"
import mongoose from "mongoose"
// import cloudinary from './../utils/cloudinary.js';
import {uploadOnCloudinary} from "../utils/cloudinary.js"

export const createGroup = async (req, res) => {
    try {
      const { name, description, members } = req.body;
      console.log(name,description,members)
      const admin = req.user._id; // Assuming authentication middleware adds `user` to req
  
      if (!name || !members || members.length === 0) {
        throw new ApiError(400, "Group name and members are required");
      }
  
      const newGroup = new Group({
        name,
        description,
        members: members.map((userId) => ({ userId })), // Add members
        admin,
      });
  
      await newGroup.save();
  
      res.status(201).json(new ApiResponse(201, newGroup, "Group created successfully"));
    } catch (error) {
      res.status(error.statusCode || 500).json(new ApiResponse(500, null, error.message));
    }
  };
  

  export const sendGroupMessage = async (req, res) => {
    try {
      const { groupId } = req.params;
      const { text, image, replyTo } = req.body;
      const senderId = req.user._id;
  
      if (!text && !image) {
        throw new ApiError(400, "Message must contain text or an image");
      }
  
      // Validate group membership
      const group = await Group.findOne({
        _id: groupId,
        $or: [
          { "members.userId": senderId },
          { admin: senderId }
        ]
      });
  
      if (!group) {
        throw new ApiError(403, "You are not a member of this group");
      }
  
      // Handle image upload
      let imageUrl = null;
      if (image) {
        const uploadResult = await cloudinary.uploader.upload(image, {
          resource_type: "auto"
        });
        imageUrl = uploadResult.secure_url;
      }
  
      // Create message with populated reply
      const newMessage = new Message({
        senderId,
        groupId,
        text: text || "",
        image: imageUrl || null,
        replyTo: replyTo || null,
      });
  
      if (replyTo) {
        const repliedMessage = await Message.findById(replyTo)
          .populate('senderId', 'fullName profilePicture');
        newMessage.replyTo = repliedMessage;
      }
  
      await newMessage.populate('senderId', 'fullName profilePicture');
      await newMessage.save();
  
      // Socket.io implementation using rooms
      io.to(groupId).emit("newGroupMessage", newMessage);
  
      // Update last interaction for all members
      const updateOperations = group.members.map(member => ({
        updateOne: {
          filter: { _id: member.userId },
          update: { $set: { lastInteractionDate: new Date() } }
        }
      }));
  
      await User.bulkWrite(updateOperations);
  
      res.status(200).json(
        new ApiResponse(200, newMessage, "Message sent successfully")
      );
  
    } catch (error) {
      res.status(error.statusCode || 500).json(
        new ApiResponse(error.statusCode || 500, null, error.message)
      );
    }
  };
  
  export const getGroupsForUser = async (req, res) => {
    try {
      const userId = req.user._id;
  
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID format");
      }
   
      const groups = await Group.find({
        $or: [
          { "members.userId": userId },
          { admin: userId }
        ]
      })
      .populate({
        path: 'admin',
        select: 'fullName profilePicture email'
      })
      .populate({
        path: 'members.userId',
        select: 'fullName profilePicture'
      })
      .lean();
  // console.log(groups)
      // Format dates and structure
      const formattedGroups = groups.map(group => ({
        _id: group._id,
        name: group.name,
        description: group.description,
        admin: group.admin,
        members: group.members.map(member => ({
          user: member.userId,
          joinedAt: new Date(member.joinedAt).toISOString()
        })),
        createdAt: new Date(group.createdAt).toISOString(),
        updatedAt: new Date(group.updatedAt).toISOString()
      }));
      console.log(formattedGroups)
      res.status(200).json(
        new ApiResponse(200, formattedGroups, "Groups fetched successfully")
      );
  
    } catch (error) {
      const statusCode = error.statusCode || 500;
      const message = error instanceof ApiError ? error.message : "Server error";
      
      // Log error for debugging
      console.error("Error fetching groups:", error);
      
      res.status(statusCode).json(
        new ApiResponse(statusCode, null, message)
      );
    }
  };
  // In groupSlice.js
  export const getGroupMessages = async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user._id;
  
      // Validate groupId format
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        throw new ApiError(400, "Invalid group ID format");
      }
  
      // Check if user is group member or admin
      const group = await Group.findOne({
        _id: groupId,
        $or: [
          { "members.userId": userId },
          { admin: userId }
        ]
      });
  
      if (!group) {
        throw new ApiError(403, "You are not a member of this group");
      }
  
      // Get messages with sender details
      const messages = await Message.find({ groupId })
  .populate('senderId', 'fullName profilePicture')
  .populate({
    path: 'replyTo',
    populate: {
      path: 'senderId',
      select: 'fullName profilePicture _id',
    },
  })
  .sort({ createdAt: 1 });
  
      res.status(200).json(
        new ApiResponse(200, messages, "Messages fetched successfully")
      );
  
    } catch (error) {
      res.status(error.statusCode || 500).json(
        new ApiResponse(error.statusCode || 500, null, error.message)
      );
    }
  };