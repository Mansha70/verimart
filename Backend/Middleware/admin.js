import  User from "../Models/User.js"

const adminAuth=(req,res,next)=>{
    if(!req.user){
        return res.status(401).json({
            success:false,
            message:"Authentication Required"
        })
    }
    if(req.user.role!="admin"){
        return res.status(401).json({
            success:false,
            message:"Only Admin can Access!!"
        })
    }
    next()
}
export default adminAuth