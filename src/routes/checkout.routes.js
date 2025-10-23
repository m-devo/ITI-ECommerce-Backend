import { Router } from 'express';
import { isAuth } from '../middlewares/isAuth.middleware.js';
import { CheckoutController } from '../controllers/api/checkout/checkout.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { checkoutSchema} from '../validations/checkout.validation.js'
import { handleIdempotency } from '../middlewares/handleIdempotency.middleware.js';


const router = Router();


router.post('/pre', isAuth , CheckoutController.preCheckout);

router.post('/', isAuth , validate(checkoutSchema) , handleIdempotency , CheckoutController.createCheckoutSession);

router.post('/webhook/:provider', CheckoutController.handlePaymentWebhook);

export default router;