import express from "express"
import {sendMessage,getMessages,deleteMessage} from "../Controllers/message.controller.js"
import auth from "../Middleware/authmid.js"

const router = express.Router()

router.post("/createMessage",auth,sendMessage)
router.get("/getAllMessage/:conversationId",auth,getMessages)
router.delete("/:id",auth,deleteMessage)

export default router