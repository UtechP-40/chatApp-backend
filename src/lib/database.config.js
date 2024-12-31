import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const DB_NAME = "ReactChatApp";

const connectDb = async () => {
    try {
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\nConnected to MongoDB: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error}`);
        process.exit(1);
    }
}

export default connectDb;