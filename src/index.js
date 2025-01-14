import express from "express"
import authRoutes from "./routes/auth.routes.js"
import messageRoutes from "./routes/message.routes.js"
import cors from "cors";
import connectDb from "./lib/database.config.js"
import cookieParser from "cookie-parser"
import dotenv from "dotenv";
import {app,server} from "./utils/socket.js"
import bodyParser from "body-parser"

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


// app.use(fileUpload({
//     limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
//   }));
// const app = express();
// import "./seeds/user.seeds.js"
app.use(express.static("public"))
dotenv.config();
app.use(cookieParser())
app.use(express.urlencoded({
    extended: true,
    limit: "20kb"
}))
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json())
const port = 80

app.use("/api/auth",authRoutes)
app.use("/api/message",messageRoutes)


connectDb().then(() => {
    server.listen(port, () => {    
        console.log(`Server is running on port http://localhost:${port}`)
    })
}).catch((error) => {
    console.log("Error connecting to MongoDB: ", error)
    process.exit(1)
})