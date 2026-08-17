import mongoose from "mongoose"

const trustSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    action:{
        type:String,
        enum:[
             "ACCOUNT_CREATED",
        "EMAIL_VERIFIED",
        "PHONE_VERIFIED",
        "GOVT_ID_VERIFIED",
        "PRODUCT_LISTED",
        "SUCCESSFUL_SALE",
        "SUCCESSFUL_PURCHASE",
        "POSITIVE_REVIEW",
        "NEGATIVE_REVIEW",
        "REPORT_APPROVED",
        "WARNING_ISSUED",
        "ACCOUNT_SUSPENDED",
        "ACCOUNT_BLOCKED",
        ],
        required:true
    },
    points:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        trim:true,
        default:"",
    },
   
},
 {
        timestamps:true,
    }
)
export default mongoose.model("TrustLog",trustSchema)