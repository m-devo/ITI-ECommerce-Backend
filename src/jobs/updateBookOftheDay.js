import cron from "node-cron"
import bookService from "../services/book.service.js"

const BookofTheDayJob = cron.schedule("0 0 8 * * *", function () {
    console.log("Task2: Trigring automatic update of the book of the day")

    bookService.automaticUpdateForTheBookOfTheDay()
}, 
{
  scheduled: true,
  timezone: "Africa/Cairo"    
});       

export default BookofTheDayJob