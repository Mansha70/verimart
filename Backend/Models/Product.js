import mongoose from "mongoose"


const productSchema=new mongoose.Schema({
    seller:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    title:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true,
        trim:true
    },
category:{
        type:String,
        required:true,
        enum: [
        "Mobiles",
        "Laptops",
        "Electronics",
        "Vehicles",
        "Furniture",
        "Fashion",
        "Books",
        "Sports",
        "Room",
        "Others",
        // legacy values from previous frontend builds, kept for compatibility
        "Home",
        "Beauty",
        "General",
      ],
      
    },
    condition:{
        type:String,
        required:true,
        enum:[
            "Like New",
            "Excellent",
            "Good",
            "Fair",
            "Needs Repair"
        ]
    },
   sellingPrice:{
    type:Number,
    required:true,
    min:1,
   },
   originalPrice:{
    type:Number,
   },
   purchaseYear:{
     type:Number,
   },
   billAvailable:{
    type:Boolean,
    default:false
   },
   warrantyAvailable: {
      type: Boolean,
      default: false,
    },
    warrantyExpiry: {
      type: Date,
    },
    brand:{
        type:String,
        required:true
    },
    model:{
        type:String,
        required:true,
    },
images:[
        {
            url:String,
            public_id:String
        }
    ],
    location:{
        city:String,
        state:String,
    },
    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "RESERVED",
        "SOLD",
        "PENDING_REVIEW",
        "REMOVED",
      ],
      default: "AVAILABLE",
    },
    views:{
        type:Number,
        default:0,
    },
    reportCount:{
        type:Number,
        default:0,
    },
},
    {
        timestamps:true
    },
)
export default mongoose.model("Product",productSchema)