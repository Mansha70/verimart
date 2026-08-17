import express from "express"
import {createReport,resolveReport,rejectReport,getMyReports,getAllReports} from "../Controllers/report.controller.js"
import auth from "../Middleware/authmid.js"
import adminAuth from "../Middleware/admin.js"
const reportRoute=express.Router()

reportRoute.post("/createReport",auth,createReport)
reportRoute.post("/resolveReport/:id",auth,adminAuth,resolveReport)
reportRoute.post("/rejectReport/:id",auth,adminAuth,rejectReport)
reportRoute.get("/getMyReport/:id",auth,getMyReports)
reportRoute.get("/getAllReport",auth,adminAuth,getAllReports)
export default reportRoute