import User from "../Models/User.js"
import Notification from "../Models/Notification.js"
import transactionRouter from "../routes/transaction.route.js"

const createNotification = async (req, res) => {
    try {
        const { user, title, body, message, type, link } = req.body;
        const notification = await Notification.create({
            user: user || req.user._id,
            title,
            message: message || body || '',
            link: link || null,
            type: (type || 'PRODUCT').toUpperCase(),
            isRead: false,
        });
        return res.status(201).json({ success: true, notification });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getMyNotification=async(req,res)=>{
    try{
   const notifications=await Notification.find({user:req.user._id}).sort({ createdAt: -1 })
   return res.status(201).json({
    success:true,
    notifications,
    count:notifications.length
   })

    }catch(error){
        return res.status(501).json({
            success:false,
            error:error.message
        })
    }
}
const markAsRead=async(req,res)=>{
    try{
        const notification=await Notification.findById(req.params.id)
        if(!notification){
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }
        if(notification.user.toString()!=req.user._id.toString()){
            return res.status(401).json({
              success:false,
              message:"You are not authorized"
            }) 
        }
        notification.isRead=true
        await  notification.save()
        return res.status(201).json({
            success:true, 
             notification,
             message:"Notification marked as Read!!"
        })
    }catch(error){
     return res.status(501).json({
        success:false,
         message:error.message
     })
    }
}
//mark all notification
const markAll=async(req,res)=>{
    try{
     await Notification.updateMany(
        {
            user:req.user._id,
            isRead:false
        },
        {
            isRead:true
        }

     )
     return res.status(201).json({
        success:true,
        message:"All notification marked"
     })
    }catch(error){
     return res.status(501).json({
        success:false,
         message:error.message
     })
    }
}

//delete notification
const deleteNotification=async(req,res)=>{
    try{
      const notification=await Notification.findById(req.params.id)
      if(!notification){
        return res.status(401).json({
            success:false,
            message:"Notification not exist!!"
        })
      }
      if(notification.user.toString()!=req.user._id.toString()){
        return res.status(401).json({
            success:false,
            message:"Not Authorized to Delete this"
        })
      }
      await Notification.findByIdAndDelete(req.params.id)
      return res.status(201).json({
        success:true,
        message:"Notification deleted Successfully!!"
      })
    }catch(error){
     return res.status(501).json({
        success:false,
         message:error.message
     })
    }
}

const clearAllNotification=async(req,res)=>{
    try{
     await Notification.deleteMany({
        user:req.user._id
     })
     return res.status(200).json({
            success: true,
            message: "All notifications deleted"
        });
    }catch(error){
       return res.status(501).json({
        success:false,
         message:error.message
     })
    }
}

export {createNotification,getMyNotification,clearAllNotification,deleteNotification,markAsRead,markAll}