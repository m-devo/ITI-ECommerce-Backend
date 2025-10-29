import express from 'express';
import compliantsController from "../controllers/api/complaints/complaint.controller.js"
import restrictTo from '../middlewares/restrictTo.middleware.js';
import protect  from "../middlewares/protect.middleware.js";

const compalintsRouter = express.Router();

compalintsRouter.get('/user',protect, compliantsController.getUserComplaints);
compalintsRouter.get('/user/:id', protect, compliantsController.getComplaintById);
compalintsRouter.post('/user/:id/reply',protect, compliantsController.userReplyToComplaint); 

compalintsRouter.get('/', protect, restrictTo("admin"), compliantsController.getAllComplaints);
compalintsRouter.get('/:id', protect, restrictTo("admin"), compliantsController.getComplaintById);
compalintsRouter.post('/:id/reply', protect, restrictTo("admin"), compliantsController.replyToComplaint);


export default compalintsRouter;