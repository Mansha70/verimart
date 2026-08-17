import Conversation from "../Models/Conversation.js"
import Message from "../Models/message.js"

export const sendMessage = async (req, res) => {
    try {
        const {conversationId, text} = req.body 
        const conversation = await Conversation.findById(conversationId)
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
    }
     if (
            !conversation.participants.some(
                user => user.toString() === req.user._id.toString()
            )
        ) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const message = await Message.create({
            conversation: conversationId,
            sender: req.user._id,
            text
        })
        conversation.lastMessage = message._id;
        await conversation.save();
        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: message
        });

    }catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


export const getMessages = async (req, res) => {

    try {

        const conversation = await Conversation.findById(req.params.conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        if (
            !conversation.participants.some(
                user => user.toString() === req.user._id.toString()
            )
        ) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const messages = await Message.find({
            conversation: req.params.conversationId
        })
        .populate("sender", "name profilePic")
        .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            count: messages.length,
            messages
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

export const deleteMessage = async (req, res) => {

    try {

        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        await Message.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Message deleted successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


export default {sendMessage,getMessages,deleteMessage}