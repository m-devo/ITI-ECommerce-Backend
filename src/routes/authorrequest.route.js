import { Router } from 'express';
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
  "/user/requests",
  protect,
  restrictTo('user','author'),
  checkAuthorRequestEligibility, 
  uploadAuthorRequestFiles,
  validateAndSaveAuthorFiles,
  createAuthorRequest
);

router.patch(
  "/user/requests/:requestId",
  protect,
  restrictTo('user','author'),
  checkAuthorRequestOwnership,        
  uploadAuthorRequestFiles,
  updateAuthorRequest
);

router.get("/user/requests", protect, restrictTo('user','author'), getAuthorRequest);

router.get(
  "/admin/requests",
  protect,
  restrictTo('admin'),
  getAllAuthorRequests
);
router.patch(
  "/admin/requests/:requestId",
  protect,
  restrictTo("admin"),
  updateAuthorRequestStatus
);
export default router;

