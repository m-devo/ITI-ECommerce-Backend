import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    reportDate: {type: Date, required:true, unique: true},
    totalRevenue: {type: Number, default:0},
    totalOrders: {type: Number, default:0},
    newUserCount:{type: Number, default:0},
    bestSellingBooks: [
        {book: {type: mongoose.Schema.Types.ObjectId, ref: "Book"},
        unitsSold: Number,
        _id: false
        }
    ],
}, {timestamps: true}
)

reportSchema.index({ reportDate: -1 });

export const Report = mongoose.model("Report", reportSchema);