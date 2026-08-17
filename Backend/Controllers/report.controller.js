import Transaction from "../Models/Transaction.js"
import Product from "../Models/Product.js"
import Report from "../Models/Report.js"
import User from "../Models/User.js"
import Notification from "../Models/Notification.js"
import Warning from "../Models/Warning.js"


//create Report
const  createReport=async(req,res)=>{
    try{
      const {reportedUser,product,reason,description,adminRemark}=req.body 
    // check completed transaction
    const transaction=await Transaction.findOne({
        buyer:req.user._id,
        seller:reportedUser,
        product,
        status:"COMPLETED"
    })
     if (!transaction) {
            return res.status(403).json({
                success: false,
                message: "You can only report a seller after a completed transaction."
            });
        }
  //prevent duplicate report
  const existingReport=await Report.findOne({
    reporter:req.user._id,
    reportedUser,
    product
  })
  if(existingReport){
     return res.status(400).json({
                success: false,
                message: "You have already reported this seller."
            });
  }
  const report=await Report.create({
    reporter:req.user._id,
    product,
    reportedUser,
    reason,
    description,
    adminRemark
  })
  // Notify all admins about the new report
  const admins = await User.find({ role: "admin" }).select("_id");
  const adminIds = admins.map(a => a._id);
  if (adminIds.length > 0) {
    const reporter = await User.findById(req.user._id).select("name");
    await Notification.insertMany(
      adminIds.map(adminId => ({
        user: adminId,
        title: "New report submitted",
        message: `${reporter?.name || "A buyer"} reported a listing (${reason}). Please review.`,
        link: "/reports",
        type: "REPORT",
        isRead: false,
      }))
    );
  }
  return res.status(201).json({
            success: true,
            message: "Report submitted successfully.",
            report
        });


    }catch(error){
         return res.status(501).json({
            success:false,
            message:error.message
         })
    }
}

const getMyReports=async(req,res)=>{
    try{
    const reports=await Report.find({reporter:req.user._id}).populate("reportedUser","name TrustScore profilePic").populate("product","title")
    return res.status(201).json({
        success:true,
        reports
    })
    }catch(error){
     return res.status(501).json({
        success:false,
        error:error.message
     })
    }
}

const getAllReports=async(req,res)=>{
    try{
    const reports=await Report.find().populate("reporter", "name")
            .populate("reportedUser", "name trustScore")
            .populate("product", "title");
    return res.status(201).json({
        success:true,
        count:reports.length,
        reports
    })
    }catch(error){
     return res.status(501).json({
        success:false,
        error:error.message
     })
    }
}

// admin resolve report 
const resolveReport=async(req,res)=>{
    try{
    const report=await Report.findById(req.params.id)
     if(!report){
        return res.status(401).json({
            success:false,
            message:"Report not exist"
        })
     }
       if (report.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Report already processed."
            });
        }

report.status="RESOLVED"
     const seller=await User.findById(report.reportedUser); 
     seller.warningCount+=1
     seller.trustScore-=10
     if(seller.warningCount>=5){
        seller.accountStatus="BLOCKED";
     }else if(seller.warningCount>=3){
        seller.accountStatus="SUSPENDED"
     }else{
        seller.accountStatus="WARNING"
     }

     await Warning.create({
       seller: report.reportedUser,
       issued_by: req.user._id,
       reason: report.reason,
       severity: seller.warningCount >= 5 ? 'critical' : seller.warningCount >= 3 ? 'major' : 'minor',
     });

     await report.save()
     await seller.save()
     // Notify the reporter and the reported seller about the outcome
     await Notification.insertMany([
       {
         user: report.reporter,
         title: "Report resolved",
         message: "Your report has been resolved. Thank you for helping keep VeriMart safe.",
         link: "/reports",
         type: "REPORT",
         isRead: false,
       },
       {
         user: report.reportedUser,
         title: "Report resolved against you",
         message: "A report against your listing was resolved. Your trust score was updated.",
         link: "/warnings",
         type: "WARNING",
         isRead: false,
       },
     ]);
     return res.status(201).json({
        success:true,
        message:"Report Resolved Successfully",
        report
     })
    }catch(error){
      return res.status(501).json({
        success:false,
        error:error.message
      })
    }
}
const rejectReport=async(req,res)=>{
    try{
         const report=await Report.findById(req.params.id)
     if(!report){
        return res.status(401).json({
            success:false,
            message:"Report not exist"
        })
     }
report.status="REJECTED"
     await report.save()
     // Notify the reporter and the reported seller about the rejection
     await Notification.insertMany([
       {
         user: report.reporter,
         title: "Report dismissed",
         message: "Your report was reviewed and dismissed by admin.",
         link: "/reports",
         type: "REPORT",
         isRead: false,
       },
       {
         user: report.reportedUser,
         title: "Report dismissed",
         message: "A report against your listing was reviewed and dismissed.",
         link: "/warnings",
         type: "REPORT",
         isRead: false,
       },
     ]);
     return res.status(201).json({
        success:true,
        report
     })

    }catch(error){
        return res.status(501).json({
        success:false,
        error:error.message
     })
    }
}

export {createReport,resolveReport,rejectReport,getMyReports,getAllReports}


