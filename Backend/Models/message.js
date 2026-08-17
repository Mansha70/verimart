import mongoose from "mongoose"

const messageSchema=new mongoose.Schema({
    conversation:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Conversation"
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    messsageType:{
        type:String,
        enum:["TEXT","IMAGE"],
        default:"TEXT"
    },
    text:{
        type:String,
        required:true,
        default:""
    },
    image:{
        url:{
            type:String,
            default:""
        },
          public_id: {
        type: String,
        default: "",
      },
    },
    isSeen:{
        type:Boolean,
        default:false,
    }

},
{
    timestamps:true
}
)
export default mongoose.model("Message",messageSchema)