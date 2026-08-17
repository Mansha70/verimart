import mongoose from "mongoose"

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
         lowerCase:true,
    },
    password:{
        type:String,
        required:true
    },
profilePic:{
        type:String,
        default:""
    },
    bio:{
        type:String,
        default:""
    },
    phone:{
        type:String,
        required:true,
        unique:true,
    },
    role:{
        type:String,
        enum:["buyer","seller","admin"],
        default:"buyer"
    },
    trustScore:{
        type:Number,
        default:50,
        min:0,
        max:100,
    },
    verification:{
        email:{
            type:Boolean,
            default:false
        },
        phone:{
            type:Boolean,
            default:false,
        },
        govtId:{
            type:Boolean,
            default:false,
        }
    },
     warningCount: {
      type: Number,
      default: 0,
    },
    accountStatus:{
    type:String,
    enum:["ACTIVE","WARNING","SUSPENDED","BLOCKED"],
    default:"ACTIVE"
    },
    successfulSales:{
        type:Number,
        default:0
    },
    successfulPurchases:{
        type:Number,
        default:0,
    }
})

export default mongoose.model("User",userSchema)
