import User from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
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
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    const user = new User({fullName, email, password});
    
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
    // res.send('SignUp route');
}
const loginRoute = async (req, res) => {
    res.send('Login route');
}
const logoutRoute = async (req, res) => {
    res.send('Logout route');
}

export {signUpRoute, loginRoute, logoutRoute};