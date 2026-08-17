import {createTransaction,acceptTransaction,rejectedTransaction,scheduleMeeting,buyerConfirmed,sellerConfirmed,getMyTransaction,getAllTransaction,getTransactionById} from "../Controllers/TransactionController.js"
import auth from "../Middleware/authmid.js"
import adminAuth from "../Middleware/admin.js"
import express from "express"

const transactionRouter=express.Router()

transactionRouter.post("/create",auth,createTransaction)
transactionRouter.patch("/accept/:id",auth,acceptTransaction)
transactionRouter.patch("/reject/:id",auth,rejectedTransaction)
transactionRouter.patch("/meeting/:id",auth,scheduleMeeting)
transactionRouter.patch("/buyer-confirm/:id",auth,buyerConfirmed)
transactionRouter.patch("/seller/:id",auth,sellerConfirmed)
transactionRouter.get("/mytransaction",auth,getMyTransaction)
transactionRouter.get("/seeAll",auth,adminAuth,getAllTransaction)
transactionRouter.get("/:id",auth,getTransactionById);
export default transactionRouter
