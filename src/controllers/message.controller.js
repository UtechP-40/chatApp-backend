import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import cloudinary from "../utils/cloudinary.js";
import {io,getReceiverSocketId} from "../utils/socket.js"
// import cloudinary from './../utils/cloudinary.js';
import {uploadOnCloudinary} from "../utils/cloudinary.js"
// import { upload } from './../middleware/multer.middleware';

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUser = req.user;
        const users = await User.find({_id:{$ne:loggedInUser._id}}).select("-password -refreshToken");
        if(!users) throw new ApiError(404, "No users found");
        res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
    } catch (error) {
        res.status(error.statusCode).json(new ApiResponse(500, null, error.message));
    }
    
}

// export const getMessages = async (req,res)=>{
//     try {
//         const {id:userToChatId}=req.params
//         const senderId=req.user._id;
//         const messages=await Message.find({
//             $or:[
//                 {senderId:senderId,reciverId:userToChatId},
//                 {senderId:userToChatId,reciverId:senderId}
//             ]
//         })
//         if(!messages) new ApiError(404,"No messages found")
//             res.status(200).json(new ApiResponse(200,messages,"Messages fetched successfully"))
//     } catch (error) {
//         res.status(error.statusCode).json(new ApiResponse(500,null,error.message))
//     }
// }

// export const sendMessage = async (req,res)=>{
//     try {
//         const {id:receiverId}=req.params
//         // console.log(receiverId,"receiverId");
//         // console.log(req.user._id,"senderId");
//         const senderId=req.user._id
//         const { text,image } = req.body;
//         // console.log(req)
//         if (!text && !image) {
//       throw new ApiError(400, "Message must contain text or an image");
//     }

//     let imageUrl = null;
//     if (image) {
//         // console.log(req.files.image.path);
//     //   const localImagePath = req.files.image.path;
//     //   const uploadResult = await uploadOnCloudinary(localImagePath);
//       const uploadResult = await cloudinary.uploader.upload(image, {
//         resource_type: "auto"
//         // folder: "folder_name"
//     })

//       if (!uploadResult) {
//         throw new ApiError(500, "Failed to upload image to Cloudinary");
//       }
//       imageUrl = uploadResult.secure_url;
//     }
//         console.log(imageUrl,"imageUrl");
//         const newMessage=new Message({
//             senderId,
//             reciverId:receiverId,//:reciverUser._id,
//             text:text || "",
//             image:imageUrl || null
//         })
//         // await newMessage.save()
//         const receiverSocketId = getReceiverSocketId(receiverId);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", newMessage);
//     }
//         if(!newMessage) throw new ApiError(500,"Failed to send message")
//         await newMessage.save()
//         res.status(200).json(new ApiResponse(200,newMessage,"Message sent successfully"))
//     } catch (error) {
//         console.log(error);
//         res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode,null,error.message))
//     }
// }

export const getMessages = async (req, res) => {
    try {
      const { id: userToChatId } = req.params;
      const senderId = req.user._id;
  
      const messages = await Message.find({
        $or: [
          { senderId, reciverId: userToChatId },
          { senderId: userToChatId, reciverId: senderId },
        ],
      }).populate("replyTo", "text senderId"); // Populate replyTo with specific fields
  
      if (!messages) throw new ApiError(404, "No messages found");
  
      res.status(200).json(new ApiResponse(200, messages, "Messages fetched successfully"));
    } catch (error) {
      res.status(error.statusCode || 500).json(new ApiResponse(500, null, error.message));
    }
  };
  

export const sendMessage = async (req, res) => {
    try {
      const { id: receiverId } = req.params;
      const senderId = req.user._id;
      const { text, image, replyTo } = req.body;
        console.log(replyTo)
      if (!text && !image) {
        throw new ApiError(400, "Message must contain text or an image");
      }
  
      let imageUrl = null;
      if (image) {
        const uploadResult = await cloudinary.uploader.upload(image, {
          resource_type: "auto",
        });
  
        if (!uploadResult) {
          throw new ApiError(500, "Failed to upload image to Cloudinary");
        }
        imageUrl = uploadResult.secure_url;
      }
  
      const newMessage = new Message({
        senderId,
        reciverId: receiverId,
        text: text || "",
        image: imageUrl || null,
        replyTo: replyTo || null, // Save the replyTo field if provided
      });
  
      const receiverSocketId = getReceiverSocketId(receiverId);
      if(newMessage.replyTo){
        let reply = await Message.findById(replyTo)
        newMessage.replyTo = reply
      }
      console.log(newMessage)
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
  
      await newMessage.save();
      res.status(200).json(new ApiResponse(200, newMessage, "Message sent successfully"));
    } catch (error) {
      console.log(error);
      res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode, null, error.message));
    }
  };
  

  export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.user._id;

        // Find the message by its ID
        const message = await Message.findById(messageId);

        if (!message) {
            throw new ApiError(404, "Message not found");
        }

        // Check if the logged-in user is the sender of the message
        if (message.senderId.toString() !== userId.toString()) {
            throw new ApiError(403, "You are not authorized to delete this message");
        }

        // Delete the message
        await message.deleteOne();

        // Optionally, you can notify the receiver via socket if needed
        const receiverSocketId = getReceiverSocketId(message.reciverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", messageId); // You can send the message ID to the receiver
        }

        res.status(200).json(new ApiResponse(200, null, "Message deleted successfully"));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode, null, error.message));
    }
};

// export {}