import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config();
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength:6
    },
    profilePicture: {
        type: String,
        default: ''
    },
    refreshToken:{
        type:String
        // default:null
    }
},{timestamps: true});

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            fullName:this.fullName,
            username:this.username
    },
    process.env.ACCESS_TOKEN_SECRATE,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRATE,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
    
}


const User = mongoose.model('User', userSchema);

export default User;