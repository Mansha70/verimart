import  Transaction from "../Models/Transaction.js"
import Product from "../Models/Product.js"
import User from "../Models/User.js"
import Review from "../Models/review.js"
import Notification from "../Models/Notification.js"
const createReview=async(req,res)=>{
    try{
       const {
            product,
            rating,
            review,
            productConditionMatched,
            sellerBehavior,
            wouldRecommend
        } = req.body;
        const existingProduct=await Product.findById(product)
        if(!existingProduct){
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        const transaction=await Transaction.findOne({
            buyer:req.user._id,
            product,
            status:"COMPLETED"
        })
        if(!transaction){
            return res.status(401).json({
                 success:false,
                 message:"Finish transaction before leaving a review"
            })
        }
        // duplicate review
        const alreadyReviewed=await Review.findOne({
            buyer:req.user._id,
            product
        })
        if(alreadyReviewed){
            return res.status(401).json({
                success:false,
                message:"Already reviewed this product"
            })
        }
const newReview=await Review.create({
            buyer:req.user._id,
            seller:existingProduct.seller,
            product,
            rating,
            review,
            productConditionMatched,
            sellerBehavior,
            wouldRecommend
        })
        // Notify the seller about the new review
        await Notification.create({
          user: existingProduct.seller,
          title: "New review received",
          message: `You received a ${rating}-star review on "${existingProduct.title}".`,
          link: "/dashboard",
          type: "REVIEW",
          isRead: false,
        });
        return res.status(201).json({
            success: true,
            message: "Review added successfully.",
            review: newReview
        });

    }catch(error){
       return res.status(501).json({
        success:false,
        message:error.message
       })
    }
}
const getProductReviews=async(req,res)=>{
    try{
      const reviews=await Review.find({product:req.params.id}).populate("buyer","name profilePic").populate("seller","name")
      return res.status(200).json({
            success:true,
            count:reviews.length,
            reviews
        });
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        });
    }

}
//getSellerReview
const getSellerReview=async(req,res)=>{
    try{
    const reviews=await Review.find({seller:req.params.sellerId}).populate("buyer","name profilePic")
    return res.status(201).json({
        success:true,
        reviews
    })


    }catch(error){
     return res.status(500).json({
            success:false,
            message:error.message
        });
    }
}

const getMyReview=async(req,res)=>{
    try{
    const reviews=await Review.find({buyer:req.user._id})
    return res.status(201).json({
        success:true,
        reviews
    })
    }catch(error){
     return res.status(500).json({
            success:false,
            message:error.message
        });
    }
}

const updateReview=async(req,res)=>{
    try{
     const review=await Review.findById(req.params.id)
     if(review.buyer.toString()!=req.user._id.toString()){
        return res.status(401).json({
            success:false,
            message:"Unauthorized"
        })
     }
     const updateReview=await Review.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new:true,
            runValidators:true
        }
     )
     return res.status(201).json({
        success:true,
        review:updateReview
     })

    }catch(error){
        return res.status(501).json({
            success:false,
            error:error.message
        })
    }
}

const deleteReview=async(req,res)=>{
    try{
       const review=await Review.findById(req.params.id)
         if(review.buyer.toString()!=req.user._id.toString()){
            return res.status(401).json({
                success:false,
                message:"You are not Authorized Bro!!"
            })            
         }
         await Review.findByIdAndDelete(req.params.id)
         return res.status(201).json({
            success:true,
            message:"Review Deleted Successfully!!"
         })
    }catch(error){
        return res.status(501).json({
            success:false,
            error:error.message
        })
    }
}

export {createReview,getProductReviews,getSellerReview,getMyReview,updateReview,deleteReview}
