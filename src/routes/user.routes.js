import { Router } from 'express';
import { UserController } from '../api/v1/admin/users/user.controller.js';
// import { objectId } from '../../validations/objectId.validation.js';
// import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.get('/', UserController.getAllUsers);


router.get(
    '/:id',
    // validate(objectId), 
    UserController.getUserById
);


export default router;
