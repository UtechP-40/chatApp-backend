import {Router} from "express"
// import Message from "../models/message.model.js"
import {upload} from "../middleware/multer.middleware.js"
import { verifyJWT } from './../middleware/auth.middleware.js';
import {getUsersForSidebar,getMessages,sendMessage} from "../controllers/message.controller.js"
const router = Router()
import { deleteMessage } from "../controllers/message.controller.js";

// Define the delete route
router.delete("/delete/:id", verifyJWT, deleteMessage);

router.get("/users", verifyJWT, getUsersForSidebar)
router.get("/:id", verifyJWT, getMessages)
// router.post("/send/:id", verifyJWT ,sendMessage)
router.post("/send/:id", verifyJWT,upload.single("image"), sendMessage)


export default router;  