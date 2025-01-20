import User from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
// import { checkAuth } from './../../../client/src/redux/features/userAuthSlice';
import Friend from "../models/friend.model.js";
// import {io,getReceiverSocketId,userSocketMap} from "../utils/socket.js"

const generateAccessAndRefreshTokens = async (userId)=>{
    try{
        const user = await User.findById(userId)
       const accessToken =  user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()

       user.refreshToken = refreshToken
       await user.save({validateBeforeSave:false})
       return {accessToken,refreshToken}
    }catch(error){
        throw new ApiError(500, "Somthing went wrong while generating refresh and access token")
    }
}

const signUpRoute = async (req, res) => {
    
    const {fullName, email, password} = req.body;
    try {
    if (
        [fullName, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    if(password.length<6){
    //    return res.status(400).json({message: "Password must be at least 6 characters long"}); 
    throw new ApiError(400, "Password is too weak")
    }
    const existedUser = await User.findOne({
      email 
    })
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists")
    }
    const user = await User.create({fullName, email, password});
    
        
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user?._id)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    // createdUser.accessToken = accessToken
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
    } catch (err) {
        // console.log(error);
        res.status(err.statusCode).json(new ApiResponse(err.statusCode || 400,null,err.message))
    }
    // res.send('SignUp route');
}

const loginRoute = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            throw new ApiError(400, "Email and Password are required");
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError(404, "User does not exist");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            throw new ApiError(401, "Incorrect password");
        }

        // Invalidate old refresh token
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { user, accessToken, refreshToken }, "User logged in successfully"));
    } catch (err) {
        return res.status(err.statusCode || 400).json(new ApiResponse(err.statusCode || 400, null, err.message));
    }
};


const logoutRoute = async (req,res)=>{
    try {
        await User.findByIdAndUpdate(
             req.user._id,
             {
                 $set:{
                     refreshToken:undefined
                 }
             },
             {
                 new:true
             }
         )
     
         const options = {
             httpOnly: true,
             secure: true
            }
            return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
             new ApiResponse(200,{},"User Logged Out Successfully")
            )
    } catch (err) {
        res.status(err.statusCode).json(new ApiResponse(err.statusCode || 400,null,err.message))
    }
 }
 
 const refreshAccessToken = async (req, res) => {
    const options = {
        httpOnly: true,
        secure: true
    };
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or invalid");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, newRefreshToken }, "Access Token refreshed"));
    } catch (err) {
        return res
            .status(err.statusCode || 401)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(err.statusCode || 400, null, err.message));
    }
};


const updateProfile = async (req,res)=>{
    const avatarLocalPath = req.files?.avatar[0]?.path;
    

    try {
    
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required")
        }
    
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        // const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
        if (!avatar) {
            throw new ApiError(400, "Avatar file is required")
        }
        const user = await User.findById(req.user._id)
        user.profilePicture = avatar.url || ""
        user.save({validateBeforeSave:false})
        res.status(200).json(new ApiResponse(200, user, "Profile updated successfully"))
    } catch (err) {
        res.status(err.statusCode || 400).json(new ApiResponse(err.statusCode || 400,null,err.message))
    }

}

const checkAuthRoute = async (req,res)=>{
    try {
        const user = await User.findById(req.user._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(404,"User not found")
        }
        res.status(200).json(new ApiResponse(200,user,"User authenticated"))
    } catch (err) {
        res.status(err.statusCode).json(new ApiResponse(err.statusCode || 400,null,err.message))
    }
}

const getAllFriends = async (req, res) => {
    const userId = req.user._id; // The logged-in user's ID
    console.log(userId)
    try {
      // Query all friends where the user is involved
      const friends = await Friend.find({ user: userId }).populate("friend", "fullName email profilePicture");
  
      if (!friends || friends.length === 0) {
        throw new ApiError(404, "No friends found");
      }
  
      res.status(200).json(
        new ApiResponse(200, friends, "Friends retrieved successfully")
      );
    } catch (err) {
      res
        .status(err.statusCode || 500)
        .json(new ApiResponse(err.statusCode || 500, null, err.message));
    }
  };

const addFriend = async (req, res) => {
    const { friendId } = req.body; // The ID of the friend being added
    const userId = req.user._id; // The logged-in user's ID
  
    try {
      // Validate IDs
      if (!friendId) {
        throw new ApiError(400, "Friend ID is required");
      }
  
      if (userId.toString() === friendId) {
        throw new ApiError(400, "You cannot add yourself as a friend");
      }
  
      // Check if the friend exists
      const friendExists = await User.findById(friendId);
      if (!friendExists) {
        throw new ApiError(404, "Friend not found");
      }
  
      // Check if the relationship already exists
      const existingFriendship = await Friend.findOne({
        user: userId,
        friend: friendId,
      });
  
      if (existingFriendship) {
        throw new ApiError(409, "You are already friends with this user");
      }
  
      // Add the friend relationship (bidirectional if required)
      const friendship1 = new Friend({ user: userId, friend: friendId });
      const friendship2 = new Friend({ user: friendId, friend: userId });
    //   console.log(existingFriendship);
      await Promise.all([friendship1.save(), friendship2.save()]);
  
      res.status(201).json(
        new ApiResponse(
          201,
          { userId, friendId },
          "Friend added successfully"
        )
      );
    } catch (err) {
      res
        .status(err.statusCode || 500)
        .json(new ApiResponse(err.statusCode || 500, null, err.message));
    }
};

const searchUsersByName = async (req, res) => {
    const { name } = req.query; // Get the search term from the query string

    if (!name) {
        return res.status(400).json(new ApiResponse(400, null, "Name is required for search"));
    }

    try {
        // Use a regular expression to find users whose fullName "almost matches" the search term
        // The "i" flag makes the regex case-insensitive
        const regex = new RegExp(name, "i");

        // Search for users whose names match the regex
        const users = await User.find({ fullName: { $regex: regex } }).select("-password -refreshToken");

        if (users.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "No users found matching that name"));
        }

        res.status(200).json(new ApiResponse(200, users, "Users found successfully"));
    } catch (err) {
        console.error(err);
        res.status(500).json(new ApiResponse(500, null, "Something went wrong while searching for users"));
    }
};

const removeFriend = async (req, res) => {
    const { friendId } = req.body; // The ID of the friend to be removed
    const userId = req.user._id; // The logged-in user's ID

    try {
        // Validate IDs
        if (!friendId) {
            throw new ApiError(400, "Friend ID is required");
        }

        if (userId.toString() === friendId) {
            throw new ApiError(400, "You cannot remove yourself as a friend");
        }

        // Check if the friend exists
        const friendExists = await User.findById(friendId);
        if (!friendExists) {
            throw new ApiError(404, "Friend not found");
        }

        // Check if the friendship exists
        const userFriendship = await Friend.findOne({ user: userId, friend: friendId });
        const friendFriendship = await Friend.findOne({ user: friendId, friend: userId });

        if (!userFriendship || !friendFriendship) {
            throw new ApiError(404, "Friendship does not exist");
        }

        // Remove the friendship (bidirectional removal)
        await Promise.all([
            Friend.deleteOne({ _id: userFriendship._id }),
            Friend.deleteOne({ _id: friendFriendship._id }),
        ]);

        res.status(200).json(
            new ApiResponse(200, { userId, friendId }, "Friend removed successfully")
        );
    } catch (err) {
        console.error(err);
        res.status(err.statusCode || 500).json(
            new ApiResponse(err.statusCode || 500, null, err.message)
        );
    }
};




export {signUpRoute, loginRoute, logoutRoute,refreshAccessToken,updateProfile,checkAuthRoute,getAllFriends,addFriend,searchUsersByName,removeFriend};