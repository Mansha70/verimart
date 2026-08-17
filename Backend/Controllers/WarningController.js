import Warning from "../Models/Warning.js";
import User from "../Models/User.js";
import Notification from "../Models/Notification.js";

const createWarning = async (req, res) => {
  try {
    const { sellerId, reason, severity } = req.body;
    const issuerId = req.user._id;

    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    const warning = await Warning.create({
      seller: sellerId,
      issued_by: issuerId,
      reason,
      severity,
    });

    const points = severity === 'critical' ? -30 : severity === 'major' ? -15 : -5;
    seller.trustScore = Math.max(0, (seller.trustScore || 50) + points);
    seller.warningCount = (seller.warningCount || 0) + 1;

    if (seller.warningCount >= 5) {
      seller.accountStatus = "BLOCKED";
    } else if (seller.warningCount >= 3) {
      seller.accountStatus = "SUSPENDED";
    } else {
      seller.accountStatus = "WARNING";
    }

    await seller.save();

    await Notification.create({
      user: sellerId,
      title: "Warning issued",
      message: `You received a ${severity} warning: ${reason}`,
      link: "/warnings",
      type: "WARNING",
      isRead: false,
    });

    return res.status(201).json({ success: true, message: "Warning issued", warning });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMyWarnings = async (req, res) => {
  try {
    const warnings = await Warning.find({ seller: req.user._id })
      .populate("issued_by", "name profilePic")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, warnings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllWarnings = async (req, res) => {
  try {
    const warnings = await Warning.find()
      .populate("seller", "name trustScore profilePic accountStatus")
      .populate("issued_by", "name")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: warnings.length, warnings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { createWarning, getMyWarnings, getAllWarnings };
