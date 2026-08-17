import express from "express";
import { createWarning, getMyWarnings, getAllWarnings } from "../Controllers/WarningController.js";
import auth from "../Middleware/authmid.js";
import adminAuth from "../Middleware/admin.js";

const warningRouter = express.Router();

warningRouter.post("/create", auth, adminAuth, createWarning);
warningRouter.get("/getMyWarnings", auth, getMyWarnings);
warningRouter.get("/getAllWarnings", auth, adminAuth, getAllWarnings);

export default warningRouter;
