import { Router } from 'express';
import AuthorRequest from "../../src/models/AuthorRequest.js";
import { createAuthorRequest, getAuthorRequest, 
   getAllAuthorRequests ,updateAuthorRequest ,
  updateAuthorRequestStatus} from "../controllers/api/admin/author.controller.js";
import restrictTo from '../middlewares/restrictTo.middleware.js';
import protect from "../middlewares/protect.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { 
  uploadAuthorRequestFiles, 
  validateAndSaveAuthorFiles,
  checkAuthorRequestEligibility,
  checkAuthorRequestOwnership,
 
} from "../middlewares/authorUpload.middleware.js";

const router = Router();
router.post(
  '/user/requests',
  protect,
  restrictTo('user', 'author'),
  checkAuthorRequestEligibility,
  uploadAuthorRequestFiles,
  validateAndSaveAuthorFiles,
  createAuthorRequest
);

router.patch(
  '/user/requests/:requestId',
  protect,
  restrictTo('user', 'author'),
  checkAuthorRequestOwnership,
  uploadAuthorRequestFiles,
  updateAuthorRequest
);

router.get(
  '/user/requests',
  protect,
  restrictTo('user', 'author'),
  getAuthorRequest
);

// ---------------- Admin Routes ----------------
router.get(
  '/admin/requests',
  protect,
  restrictTo('admin'),
  getAllAuthorRequests
);

router.get(
  '/admin/requests/:id',
  protect,
  restrictTo('admin'),
  async (req, res) => {
    const reqId = req.params.id;
    const request = await AuthorRequest.findById(reqId).populate('user', 'email role');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({
      success: true,
      data: request
    });
  }
);

router.patch(
  '/admin/requests/:requestId',
  protect,
  restrictTo('admin'),
  updateAuthorRequestStatus
);

router.delete(
  '/admin/requests/:id',
  protect,
  restrictTo('admin'),
  async (req, res) => {
    const reqId = req.params.id;
    const deleted = await AuthorRequest.findByIdAndDelete(reqId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({
      success: true,
      message: `Request with id ${reqId} deleted successfully`
    });
  }
);

router.delete(
  '/admin/requests/cleanup',
  protect,
  restrictTo('admin'),
  async (req, res) => {
    const { status } = req.query; 
    const deleted = await AuthorRequest.deleteMany({ status });

    res.json({
      success: true,
      message: `Deleted ${deleted.deletedCount} requests`
    });
  }
);

export default router;

