import User from "../models/user.model";
import Message from "../models/message.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";


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

// export {}