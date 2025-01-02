import {Router} from "express"
import Message from "../models/message.model.js"
import { verifyJWT } from './../middleware/auth.middleware';
import {getUsersForSidebar} from "../controllers/message.controller.js"
const router = Router()

router.post("/users", verifyJWT, getUsersForSidebar)

export default router;  