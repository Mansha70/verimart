import Transaction from "../Models/Transaction.js"
import Product from "../Models/Product.js"
import User from "../Models/User.js"
import Notification from "../Models/Notification.js"
import Conversation from "../Models/Conversation.js"

const createTransaction = async (req, res) => {
    try {
        const { product, agreedPrice, meeting, date, time, paymentMethod } = req.body;
        const existingProduct = await Product.findById(product);
        if (!existingProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        if (existingProduct.seller.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot buy your own product" });
        }
        // Auto-create (or reuse) a conversation between buyer and seller for this product
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user._id, existingProduct.seller] },
            product: existingProduct._id
        });
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [req.user._id, existingProduct.seller],
                product: existingProduct._id
            });
        }
        const transaction = new Transaction({
            product,
            buyer: req.user._id,
            seller: existingProduct.seller,
            agreedPrice,
            meeting,
            date,
            time,
            paymentMethod,
            conversation_id: conversation._id,
buyerConfirmed: false,
            sellerConfirmed: false,
            status: "REQUESTED"
        });
        await transaction.save();
        // Notify the seller of the new purchase request
        await Notification.create({
          user: existingProduct.seller,
          title: "New purchase request",
          message: `A buyer requested to purchase "${existingProduct.title}" for ${agreedPrice}.`,
          link: "/orders",
          type: "TRANSACTION",
          isRead: false,
        });
        return res.status(201).json({ success: true, message: "Purchase request sent", transaction });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const acceptTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });
if (transaction.seller.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "You are not the seller of this product" });
        transaction.status = "ACCEPTED";
        await transaction.save();
        // Notify the buyer that the seller accepted
        await Notification.create({
          user: transaction.buyer,
          title: "Order accepted",
          message: "The seller accepted your purchase request.",
          link: "/orders",
          type: "TRANSACTION",
          isRead: false,
        });
        return res.status(200).json({ success: true, message: "Accepted", transaction });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const rejectedTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });
        if (transaction.seller.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "You are not the seller" });
        transaction.status = "REJECTED";
        await transaction.save();
        return res.status(200).json({ success: true, message: "Transaction rejected by seller", transaction });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const scheduleMeeting = async (req, res) => {
    try {
        const { meeting, date, time } = req.body;
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });
        if (transaction.seller.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Only seller can schedule the meeting." });
        if (transaction.status !== "ACCEPTED") return res.status(400).json({ success: false, message: "Transaction must be accepted first." });
        transaction.meeting = meeting;
        transaction.date = date;
        transaction.time = time;
        transaction.status = "MEETING_SCHEDULED";
        await transaction.save();
        return res.status(200).json({ success: true, message: "Meeting scheduled successfully.", transaction });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const buyerConfirmed = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not exist" });
        if (transaction.status !== "MEETING_SCHEDULED") return res.status(400).json({ success: false, message: "Meeting not completed yet." });
        if (transaction.buyer.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Only Buyer can make this confirmation" });
transaction.buyerConfirmed = true;
        if (transaction.buyerConfirmed && transaction.sellerConfirmed) {
            transaction.status = "COMPLETED";
            await Product.findByIdAndUpdate(transaction.product, { status: "SOLD" });
            await User.findByIdAndUpdate(transaction.buyer, { $inc: { successfulPurchases: 1, trustScore: 2 } });
            await User.findByIdAndUpdate(transaction.seller, { $inc: { successfulSales: 1, trustScore: 5 } });
            await Notification.create({ user: transaction.seller, title: "Order completed", message: "Your order was completed. Trust score updated.", link: "/orders", type: "TRANSACTION", isRead: false });
        }
        await transaction.save();
        return res.status(200).json({ success: true, transaction });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const sellerConfirmed = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not exist" });
        if (transaction.status !== "MEETING_SCHEDULED") return res.status(400).json({ success: false, message: "Meeting not completed yet." });
        if (transaction.seller.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Only Seller can make this confirmation" });
        transaction.sellerConfirmed = true;
        if (transaction.buyerConfirmed && transaction.sellerConfirmed) {
            transaction.status = "COMPLETED";
            await Product.findByIdAndUpdate(transaction.product, { status: "SOLD" });
            await User.findByIdAndUpdate(transaction.buyer, { $inc: { successfulPurchases: 1, trustScore: 2 } });
            await User.findByIdAndUpdate(transaction.seller, { $inc: { successfulSales: 1, trustScore: 5 } });
        }
        await transaction.save();
        return res.status(200).json({ success: true, transaction });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getMyTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.find({ $or: [{ buyer: req.user._id }, { seller: req.user._id }] })
            .populate("buyer", "name profilePic email")
            .populate("seller", "name trustScore profilePic")
            .populate("product", "title images sellingPrice");
        return res.status(200).json({ success: true, count: transaction.length, transaction });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate("buyer", "name phone email profilePic")
            .populate("seller", "name phone trustScore profilePic")
            .populate("product", "title images");
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });
        return res.status(200).json({ success: true, transaction });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAllTransaction = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate("buyer", "name phone email profilePic")
            .populate("seller", "name phone trustScore profilePic")
            .populate("product", "title images");
        return res.status(200).json({ success: true, count: transactions.length, transactions });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export {createTransaction,acceptTransaction,rejectedTransaction,scheduleMeeting as scheduleMeeting,buyerConfirmed,sellerConfirmed,getMyTransaction,getAllTransaction,getTransactionById}