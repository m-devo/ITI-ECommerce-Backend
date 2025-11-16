import { Complaint } from "../../../models/complaints.model.js";
import notifyUser from "../../../chatbot/notifyUser.js";
import { ComplaintService } from '../../../services/complaint.service.js';

/* Admin */
const getAllComplaints = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const statusFilter = req.query.status;

        const query = {};
        if (statusFilter) {
            query.status = statusFilter;
        }

        const skip = (page - 1) * limit;

        const complaints = await Complaint.find(query)
            .populate("user", "firstName lastName email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalComplaints = await Complaint.countDocuments(query);

        res.status(200).json({
            status: "success",
            data: {
                complaints,
                currentPage: page,
                totalPages: Math.ceil(totalComplaints / limit),
                totalComplaints
            }
        });
    } catch (error) {
        console.error("Error fetching complaints:", error);
        next(error); 
    }
};

const getComplaintById = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
                                    .populate("user", "firstName lastName email")
                                    .populate("replies.sender", "firstName lastName email role");

        if (!complaint) {
            return res.status(404).json({ status: "fail", message: "Complaint not found" });
        }

        res.status(200).json({
            status: "success",
            data: {
                complaint
            }
        });
    } catch (error) {
        console.error(`Error fetching complaint ${req.params.id}:`, error);

        if (error.name === "CastError") {
            return res.status(400).json({ 
                status: "fail", message: "Invalid complaint ID format" 
            });
        }
        next(error);
    }
};

const replyToComplaint = async (req, res, next) => {
    try {
        const { replyMessage, newStatus } = req.body;
        const adminUserId = req.user._id; 

        if (!replyMessage) {
            return res.status(400).json({ status: "fail", message: "Reply message is required" });
        }

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ status: "fail", message: "Complaint not found" });
        }

        complaint.replies.push({
            sender: adminUserId,
            message: replyMessage
        });

        if(newStatus && ["inProgress", "resolved", "closed"].includes(newStatus)) {
            complaint.status = newStatus
        } else {
        complaint.status = "inProgress"; 
        }


        await complaint.save();

        try {
            notifyUser(complaint.user.toString(), replyMessage, complaint._id.toString());
        } catch (notifyError) {
            console.error("Error sending live reply notification:", notifyError);
        }

        await complaint.populate([
            {path: "user", select: "firstName lastName email"},
            {path: "replies.sender", select: "firstName lastName email role"}
        ])
        res.status(200).json({
            status: "success",
            message: "Reply added successfully",
            data: {
                complaint: complaint 
            }
        });
    } catch (error) {
        console.error(`Error replying to complaint ${req.params.id}:`, error);
        if (error.name === "CastError") {
            return res.status(400).json({ status: "fail", message: "Invalid complaint ID format" });
        }
        next(error);
    }
};
/* User */
const createNewComplaint = async (req, res, next) => {
    try {
        const { details, orderId } = req.body;
        const userId = req.user._id;

        if (!details) {
            return res.status(400).json({ status: "fail", message: "Complaint details are required" });
        }

        const newComplaint = await ComplaintService.createNewComplaint(userId, details, orderId);

        res.status(201).json({
            status: "success",
            message: "Your complaint has been submitted successfully.",
            data: { complaint: newComplaint }
        });

    } catch (error) { 
        next(error); 
    }
};

const getUserComplaints = async (req, res, next) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;
    try {
       
        const complaints = await Complaint.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select("-replies")
            .skip(skip)
            .limit(limit)

        const totalComplaints = await Complaint.countDocuments({ user: req.user._id });            
        res.status(200).json({
            status: "success",
            data: {
                complaints,
                currentPage: page,
                totalPages: Math.ceil(totalComplaints / limit),
                totalComplaints
            }
        });

    } catch (error) { next(error); }
};

const getUserComplaintById = async (req, res, next) => {
    try {
        const complaint = await Complaint.findOne({ _id: req.params.id, user: req.user._id })
            .populate("user", "firstName lastName email")
            .populate("replies.sender", "firstName lastName email role");

        if (!complaint) {
            return res.status(404).json({ status: "fail", message: "Complaint not found or you don't have permission." });
        }
        res.status(200).json({ status: "success", data: { complaint } });
    } catch (error) { next(error); }
};

const userReplyToComplaint = async (req, res, next) => {
    try {
        const { replyMessage } = req.body;
        const userId = req.user._id;

        if (!replyMessage) {
             return res.status(400).json({ status: "fail", message: "Reply message is required" });
        }

        const complaint = await Complaint.findOne({ _id: req.params.id, user: userId });

        if (!complaint) {
            return res.status(404).json({ status: "fail", message: "Complaint not found or don't have permission." });
        }

        if (complaint.status === 'closed') {
             return res.status(400).json({ status: "fail", message: "This complaint is closed and cannot be replied to." });
        }

        complaint.replies.push({
            sender: userId, 
            message: replyMessage
        });

        if (complaint.status === 'resolved') {
            complaint.status = "inProgress"; 
        }
        await complaint.save();

            const populatedComplaint = await Complaint.findById(complaint._id)
            .populate("user", "firstName lastName email")
            .populate("replies.sender", "firstName lastName email role");

        res.status(200).json({
            status: "success",
            message: "Your reply has been added.",
            data: { complaint:populatedComplaint }
        });

    } catch (error) { next(error); }
};


export default { 
    getAllComplaints, getComplaintById, replyToComplaint, 
    getUserComplaints, getUserComplaintById, userReplyToComplaint,
    createNewComplaint
};