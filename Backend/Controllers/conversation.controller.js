import Conversation from "../Models/Conversation.js"

export const createConversation = async (req, res) => {
    try {
        const {receiverId,productId} = req.body 

        let conversation = await Conversation.findOne({
            participants: { $all: [req.user._id, receiverId] },
            product: productId
        })
        if (conversation) {
            return res.status(200).json({
                success: true, 
                message: "Conversation already exists!",
                conversation
            })
        }
        conversation = await Conversation.create({
            participants: [req.user._id, receiverId],
            product: productId
        })
        return res.status(201).json({
            success: true,
            message: "Conversation Created Successfully!!",
            conversation
        })
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const getMyConversation = async (req, res) => {
    try {
        const conversation = await Conversation.find({
            participants: req.user._id
        }).populate("participants","name profilePic")
          .populate("product","title images")
          .populate("lastMessage")
        return res.status(200).json({
            success: true,
            conversation
        })
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const getMyConversationById = async (req, res) => {
    try {
       const conversation = await Conversation.findById(req.params.id)
        .populate("participants", "name profilePic")
        .populate("product", "title images")
        .populate("lastMessage");
        if (!conversation) {
             return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }
        //security check
        if (!conversation.participants.some(user => user._id.toString() == req.user._id.toString())) {
             return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }
         return res.status(200).json({
            success: true,
            conversation
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}