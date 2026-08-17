import mongoose from "mongoose"

const notificationSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    title:String,
    message:String,
    link:{
        type:String,
        default:null
    },
    type:{
        type:String,
        enum:[
            "REPORT",
            "TRANSACTION",
            "REVIEW",
            "CHAT",
            "WARNING",
            "PRODUCT"
        ]
    },
    isRead:{
        type:Boolean,
        default:false
    }
},
{
    timestamps:true
}
)
export default mongoose.model("Notification",notificationSchema)