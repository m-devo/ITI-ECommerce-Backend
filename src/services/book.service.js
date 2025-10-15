import Book from "../models/bookSchema.js"
import cacheService from './cache.service.js';

// Manual Update --- Admin ---
const bookOfTheDay = (async function (bookId) {
    console.log(`Selecting a book manualy by admin to be featured as the Book of the Day: ${bookId}`);

    await Book.updateMany({}, {$unset :{featuredAt: ""}});

    const updateBook = await Book.findByIdAndUpdate(bookId, {$set :{featuredAt: new Date()}}, {new: true})

    await cacheService.del("homepage");

    console.log(`Updating featured book: set: ${updateBook.title} and deleted cache`)

    return updateBook;
})

// Automatic Update --- Cron :) ---
const automaticUpdateForTheBookOfTheDay = (async function (){
    console.log(`Cron Task 2, updating featured book automatically :)`)

    const today = new Date();
    const yesterday = new Date(today); 
    yesterday.setDate(today.getDate() - 1);

    const startingDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    const endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);

    const manualSelection = await Book.findOne({featuredAt: {$gte:startingDate, $lte:endDate}})

    if(manualSelection) {
        console.log("the Book is chosed mannually")
        return;
        
    }

    await Book.updateMany({}, {$unset: {featuredAt: ""}})

    const automaticChosing = await Book.aggregate([
        {$match: {reviewCount: {$gte: 5}, averageRating: {$gte: 4}}},

        {
            $addFields: {
                score: {
                    $add: [
                        {$multiply: ["averageRating", 2]},
                        {$log10: "$reviewCount"}
                    ]
                }
            }
        },

        {$sort: {score: -1}},
        {$limit: 5},
        {$sampel: {size: 1}}
    ])

    if (automaticChosing.length ===0) {
        console.log("Noe Sutibale Book is found")
    }

    const newBookOfTheDay = automaticChosing[0];

    await Book.findByIdAndUpdate(newBookOfTheDay._id, {$set: {featuredAt: new Date()}})

    await cacheService.del("homepage")

    const chosenBook = await Book.findById(newBookOfTheDay._id)
    console.log("Book is selected");

    return chosenBook

})

export default {bookOfTheDay, automaticUpdateForTheBookOfTheDay}