import {register,Login,getProfile,updateProfile,getAllUsers,updateUserStatus} from "../Controllers/auth.controller.js"
import authmid from "../Middleware/authmid.js"
import adminAuth from "../Middleware/admin.js"
import upload from "../Middleware/upload.js"
import express from "express"
const router=express.Router()

router.post("/register",register)
router.post("/login",Login)
router.get("/getProfile",authmid,getProfile)
router.patch("/updateProfile",authmid,upload.single("profilePic"),updateProfile)
router.get("/users", authmid, adminAuth, getAllUsers)
router.patch("/users/:id/status", authmid, adminAuth, updateUserStatus)



export default router
