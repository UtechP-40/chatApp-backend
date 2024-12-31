import express from 'express';
import {signUpRoute, loginRoute, logoutRoute} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signUpRoute);
router.post('/login', loginRoute);
router.post('/logout', logoutRoute);
export default router;  