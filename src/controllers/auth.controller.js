import User from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
// import { checkAuth } from './../../../client/src/redux/features/userAuthSlice';

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
    const {email,password}=req.body
    try{
    if(!email){
        throw new ApiError(400, "Email is required")
    }

   const user = await User.findOne(
    {email}
   )
   if(!user){
    throw new ApiError(404, "User dose not exist")
   }
   const isPasswordValid =  await user.isPasswordCorrect(password)
   if(!isPasswordValid){
    throw new ApiError(404, "Incorrect Password")
   }
   
   const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
   console.log(refreshToken,accessToken);
user.refreshToken = refreshToken;
await user.save({ validateBeforeSave: false });
   console.log(refreshToken)
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
    httpOnly: true,
    secure: true
   }

res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
    new ApiResponse(
        200,
        {
            user: loggedInUser,
            accessToken,
            refreshToken
        },
        "User logged in Successfully"
    )
)
}catch(err){
    console.log(err)
    res.status(err.statusCode || 404).json(new ApiResponse(err.statusCode || 400,null,err.message))
}
}
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
 
const refreshAccessToken = async (req,res)=>{
    try {
     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshTokne
     if(!incomingRefreshToken){
         throw new ApiError(401,"unauthorized request")
     }
     
         const decodedToken = jwt.verify(
             incomingRefreshToken,
             process.env.REFRESH_TOKEN_SECRATE
         )
         const user = await User.findById(decodedToken?._id)
     
         if(!user){
             throw new ApiError(401,"Invalid Refresh token")
         }
         if(incomingRefreshToken !== user?.refreshToken){
             throw new ApiError(401,"Refresh token is expired or used")
         }
         const options = {
             httpOnly:true,
             secure:true
         }
         const {accessToken,newrefreshToken} =await generateAccessAndRefreshTokens(user._id)
         return res.status(200).cookie("accessToken",accessToken ,options).cookie("refreshToken",newrefreshToken,options).json(
             new ApiResponse(
                 200,
                 {
                     accessToken,newrefreshToken
                 },
                 "Access Token refreshed"
             )
         )
     } catch (err) {
        //  throw new ApiError(401,err?.message || "Invalid refresh Token")
         res.status(err.statusCode).json(new ApiResponse(err.statusCode || 400,null,err.message))
     }
 }

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
        res.status(err.statusCode).json(new ApiResponse(err.statusCode || 400,null,err.message))
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

export {signUpRoute, loginRoute, logoutRoute,refreshAccessToken,updateProfile,checkAuthRoute}; 