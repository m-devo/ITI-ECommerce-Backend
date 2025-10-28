import { Complaint } from "../../../models/complaints.model.js";
import notifyUser from "../../../chatbot/notifyUser.js";

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
        const { replyMessage } = req.body;
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

        complaint.status = "resolved"; 

        await complaint.save();

        try {
            notifyUser(complaint.user.toString(), replyMessage, complaint._id.toString());
        } catch (notifyError) {
            console.error("Error sending live reply notification:", notifyError);
        }

        const updatedComplaint = await Complaint.findById(req.params.id)
            .populate("user", "firstName lastName email")
            .populate("replies.sender", "firstName lastName email role");

        res.status(200).json({
            status: "success",
            message: "Reply added successfully",
            data: {
                complaint: updatedComplaint 
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

export default { getAllComplaints, getComplaintById, replyToComplaint };