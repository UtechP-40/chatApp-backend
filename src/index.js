import express from "express"
import authRoutes from "./routes/auth.routes.js"
import messageRoutes from "./routes/message.routes.js"
import cors from "cors";
import connectDb from "./lib/database.config.js"
import cookieParser from "cookie-parser"
import dotenv from "dotenv";
import {app,server} from "./utils/socket.js"
import bodyParser from "body-parser"
import path from "path"
const __dirname = path.resolve();
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

const origion = process.env.NODE_ENV === "production"?process.env.CORS_ORIGIN: "http://localhost:5173"

app.use(cors({
    origin: origion,
    credentials: true
}))
app.use(express.json())
const port = 80
// app.use(express.static(path.join(__dirname, "../client/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../client", "dist", "index.html"));
//   });
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