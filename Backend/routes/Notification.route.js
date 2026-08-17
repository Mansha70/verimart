import express from "express"
import {createNotification,getMyNotification,clearAllNotification,deleteNotification,markAsRead,markAll} from "../Controllers/Notification.controller.js"
import auth from "../Middleware/authmid.js"
const NotificationRouter=express.Router()

NotificationRouter.post("/createNotification",auth,createNotification)
NotificationRouter.get("/getMyNotification",auth,getMyNotification)
NotificationRouter.put("/clearAllNotification",auth,clearAllNotification)
NotificationRouter.patch("/deleteNotification/:id",auth,deleteNotification)
NotificationRouter.patch("/markAsRead/:id",auth,markAsRead)
NotificationRouter.put("/markAll",auth,markAll)
export  default NotificationRouter

