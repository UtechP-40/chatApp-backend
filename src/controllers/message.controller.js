import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export const getMessages = async (req,res)=>{
    try {
        const {id:userToChatId}=req.params
        const senderId=req.user._id;
        const messages=await Message.find({
            $or:[
                {senderId:senderId,receiverId:userToChatId},
                {senderId:userToChatId,receiverId:senderId}
            ]
        })
        if(!messages) new ApiError(404,"No messages found")
            res.status(200).json(new ApiResponse(200,messages,"Messages fetched successfully"))
    } catch (error) {
        res.status(error.statusCode).json(new ApiResponse(500,null,error.message))
    }
}

export const sendMessage = async (req,res)=>{
    try {
        const {id:receiverId}=req.params
        const senderId=req.user._id
        const {text}=req.body
        const image = req.files?.image[0]?.path;
        let imageUrl
        if(image){
        const uploadImage = await uploadOnCloudinary(image)

        if(!uploadImage) throw new ApiError(500,"Something went wrong while uploading image")
         imageUrl = uploadImage.secure_url
        }
        const newMessage=new Message({
            senderId,
            receiverId,
            text,
            image:imageUrl || null
        })
        await newMessage.save()
        res.status(200).json(new ApiResponse(200,newMessage,"Message sent successfully"))
    } catch (error) {
        res.status(error.statusCode).json(new ApiResponse(500,null,error.message))
    }
}
// export {}