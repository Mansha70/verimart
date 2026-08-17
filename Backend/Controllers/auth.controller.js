import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../Models/User.js"
const register=async(req,res)=>{
    try{
        let {name,email,password,profilePic,phone,role,trustScore,verification,warningCount,accountStatus,successfulSales,successfulPurchase}=req.body
        const existUser=await User.findOne({email})
        if(existUser){
            return res.status(400).json({
                success:false,
                message:"User already exists, please login"
            })
        }

        const hashedPassword=await bcrypt.hash(password,10)
        const user=new User({
            name,
            email,
            password:hashedPassword,
            profilePic,
            phone,
            role,
            trustScore,
            verification,
            warningCount,
            accountStatus,
            successfulSales,
            successfulPurchase
        })
        await user.save()
        return res.status(201).json({
            success:true,
            message:"User Registered Successfully!!",
            user
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }

}

const Login=async(req,res)=>{
    try{
        let {email,password,verification}=req.body
        const user=await User.findOne({email})
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User does not exist"
            })
        }
        const isMatch=await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.status(401).json({
                success:false,
                message:"Password is wrong"
            })
        }
        const token=jwt.sign(
            {
                id:user._id,
                role:user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn:"7d"
            }
        )
        return res.status(200).json({
            success:true,
            message:"Login Successful",
            token,
            user
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
    
}

const getProfile=async(req,res)=>{
        try{
                const user=await User.findById(req.user.id).select("-password")
                if(!user){
                        return res.status(404).json({
                                success:false,
                                message:"User does not exist"
                        })
                }
                return res.status(200).json({
                        success:true,
                        user
                })

        }catch(error){
            return res.status(500).json({
                success:false,
                message:error.message
            })
        }
}




const updateProfile = async (req, res) => {
    try {
        const { name, phone, bio } = req.body;

        // Prevent role escalation through profile edit
        const updateData = { name, phone, bio };

        // Handle profile picture upload (if any)
        if (req.file) {
            const relative = req.file.path.split("uploads").pop().replace(/\\/g, "/");
            updateData.profilePic = `/uploads${relative}`;
        }

        // Only allow updating fields that were actually provided
        Object.keys(updateData).forEach((key) => {
            if (updateData[key] === undefined || updateData[key] === "") {
                delete updateData[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        // Handle duplicate phone/email errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Phone number already in use by another account"
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { isBlocked, blockedReason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if (isBlocked) {
            user.accountStatus = "BLOCKED";
        } else {
            user.accountStatus = "ACTIVE";
        }
        await user.save();
        return res.status(200).json({
            success: true,
            message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export { register, Login, getProfile, updateProfile, getAllUsers, updateUserStatus }
