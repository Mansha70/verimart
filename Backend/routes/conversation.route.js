import express from "express"
import {createConversation,getMyConversation,getMyConversationById} from "../Controllers/conversation.controller.js"
import auth from "../Middleware/authmid.js"

const convRouter = express.Router()

convRouter.post("/createConversation",auth,createConversation)
convRouter.get("/getMyConversation",auth,getMyConversation)
convRouter.get("/:id",auth,getMyConversationById)

export default convRouter