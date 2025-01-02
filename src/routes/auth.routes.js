import express from 'express';
import {signUpRoute, loginRoute, logoutRoute,refreshAccessToken,updateProfile} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {upload} from '../middleware/multer.middleware.js';
const router = express.Router();

router.post('/signup', signUpRoute);
router.post('/login', loginRoute);
router.post('/refresh-token',refreshAccessToken)
router.post('/logout', verifyJWT,logoutRoute);
router.post('/update-profile', verifyJWT,upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]),updateProfile);
export default router;  