import mongoose from "mongoose";
// import validator from "validator";

const reportSchema = new mongoose.Shema({
    reportDate: {type: Date, default:0},
    totalRevenue: {type: Number, default:0},
    totalOrders: {type: Number, default:0},
    newUsersCount:{type: Number, default:0},
    bestSellingBooks: [
        {book: {type: mongoose.Shema.Types.ObjectID, ref: "Book"},
        unitsSold: Number,
        _id: false
        }
    ],

    generatedAta: {type:Date, default:Date.now},

})

export const Report = mongoose.model("Report", reportSchema);