import mongoose from "mongoose"

const reviewSchema=new mongoose.Schema({
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required:true
    },
    seller:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    buyer:{
          type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    rating:{
        type:Number,
        required:true,
        min:1,
        max:5
    },
    review:{
        type:String,
        required:true,
        maxLength:500,
    },
    productConditionMatched:{
        type:Boolean,
        default:true,
    },
    sellerBehavior: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor"],
      default: "Good",
    },
    wouldRecommend:{
        type:Boolean,
        default:true
    }


},
{
    timestamps:true
}
)
export default mongoose.model("Review",reviewSchema)