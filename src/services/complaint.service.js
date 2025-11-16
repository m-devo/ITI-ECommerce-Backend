import { Complaint } from '../models/complaints.model.js';
import ApiError from '../utils/ApiError.js';

async function checkOpenComplaints(userId) {
    const existingOpenComplaint = await Complaint.findOne({ 
        user: userId, 
        status: { $in: ["new", "inProgress"] } 
    });

    if (existingOpenComplaint) {
        throw new ApiError(400, "You already have an open complaint (Status: " + 
            existingOpenComplaint.status + "). Please wait for us to resolve it.");
    }
}

export const ComplaintService = {

    async createNewComplaint(userId, details, orderId = null) {
        await checkOpenComplaints(userId);

        const newComplaint = await Complaint.create({
            user: userId,
            details: details,
            order: orderId
        });
        
        return newComplaint;
    },

    checkOpenComplaints: checkOpenComplaints
};