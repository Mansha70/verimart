import express from "express"
import {createReview,getProductReviews,getSellerReview,getMyReview,updateReview,deleteReview} from "../Controllers/review.controller.js"
import auth from "../Middleware/authmid.js"
const reviewRouter=express.Router()

reviewRouter.post("/createReview",auth,createReview)
reviewRouter.patch("/updateReview/:id",auth,updateReview)
reviewRouter.delete("/deleteReview/:id",auth,deleteReview)
reviewRouter.get("/seller/:sellerId",getSellerReview)
reviewRouter.get("/myReview",auth,getMyReview)
reviewRouter.get("/ProductReview/:productId",getProductReviews)
export default reviewRouter