import cron from "node-cron"

import cartService from "../services/cart.service.js";

const abandodedCartJob = cron.schedule("0 12 * * *", function () {
    console.log("Cron Task 4: Trigring abandoned cart process...")

    cartService.AbandonedCartReminder();

}, {
 
    scheduled: true,
    timezone: "Africa/Cairo"
}
)

export default abandodedCartJob;