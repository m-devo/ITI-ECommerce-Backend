import express from "express"
import cartController from "../controllers/api/cart/cart.controller.js"
// import protect from "../middlewares/protect.middleware.js"
// import restrictTo from "../middlewares/restrictTo.middleware.js"

const cartRouter = express.Router()

cartRouter.post("/abandoned-cart",
    // protect,
    // restrictTo("admin"),
    cartController
)

export default cartRouter;