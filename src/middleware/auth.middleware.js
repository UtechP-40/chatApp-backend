import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import  User  from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRATE)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = user;
        next()
    } catch (err) {
        // throw new ApiError(401, error?.message || "Invalid Access Token")
        res.status(err.statusCode).json(new ApiResponse(err.statusCode || 400,null,err.message))
    }
})