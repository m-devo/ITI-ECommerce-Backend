import mongoose  from 'mongoose'

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  descrption: { type: String, required: true },
  price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
  stock: { type: Number, required: true, min: [0, 'Stock cannot be negative'] },
  bookPath: { type: String, required: true },
  imagePath:{ type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  averageRating: {type: Number, default: 0},
  featuredAt:{type: Date, index: true},
  reviewCount: {type: Number, default: 0},
  recomendedBooks: [{ // for recommendations engine 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book"
    }],
  descriptionVector: { //for smart search
        type : [Number]
    },
    
}, {timestamps:true})

export default mongoose.model('Book', bookSchema);