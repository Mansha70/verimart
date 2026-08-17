import mongoose from "mongoose"

const reportSchema=new mongoose.Schema({
    reporter:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    reportedUser:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required:true
    },
    reason:{
        type:String,
        enum:[
        "Fake Product",
        "Scam",
        "Wrong Description",
        "Duplicate Listing",
        "Abusive Behaviour",
        "Spam",
        "Other"
        ],
        required:true
    },
    description:{
        type:String,
        required:true,
        maxLength:100
    },
    status:{
        type:String,
        enum:[
            "PENDING",
            "UNDER_REVIEW",
            "RESOLVED",
            "REJECTED",
        ],
        default:"PENDING"
    },
    adminRemark:{
        type:String,
        required:false,
        default:""
    },
    resolvedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    resolvedAt:{
        type:Date,
    }
},
{

    timestamps:true
}
)
export default mongoose.model("Report",reportSchema)