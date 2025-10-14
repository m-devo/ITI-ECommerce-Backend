import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    reportDate: {type: Date, required:true, unique: true},
    totalRevenue: {type: Number, default:0},
    totalOrders: {type: Number, default:0},
    newUsersCount:{type: Number, default:0},
    bestSellingBooks: [
        {book: {type: mongoose.Schema.Types.ObjectId, ref: "Book"},
        unitsSold: Number,
        _id: false
        }
    ],
}, {timestamps: true}
)

export const Report = mongoose.model("Report", reportSchema);