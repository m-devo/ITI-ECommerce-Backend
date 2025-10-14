import { Router } from 'express';
import { UserController } from '../controllers/api/admin/user.controller.js';
// import { objectId } from '../../validations/objectId.validation.js';
// import { validate } from '../middlewares/validate.middleware.js';
import restrictTo from '../middlewares/restrictTo.middleware.js';
import protect  from "../middlewares/protect.middleware.js";
const router = Router();

router.get('/users',protect,restrictTo('admin') ,UserController.getAllUsers);


router.get(
    '/users/:id',
    protect,restrictTo('admin'),
    UserController.getUserById
);
router.post(
    '/users/update/:id',
    protect,restrictTo('admin'),
    UserController.updateUser
)
router.delete(
    '/users/delete/:id',
    protect,restrictTo('admin'),
    UserController.deleteUser
);
export default router;