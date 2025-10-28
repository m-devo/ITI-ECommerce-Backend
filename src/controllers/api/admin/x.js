const updateBook = catchAsync(async (req, res, next) => {
  try {
    const {requestId} = req.params;
    if (!mongoose.Types.ObjectId.isValid(ID)) {
      return res.status(400).json(new ApiResponse(400, null, 'Invalid Book ID.'));
    }

     const request = await AuthorRequest.findOne({ _id: requestId, user: userId });;
    if (!request) {
      return res.status(404).json(new ApiResponse(404, null, 'request not found'));
    }

    const extractKeyFromUrl = (url) => {
      try {
        const parts = url.split('.amazonaws.com/');
        return parts[1] || url;
      } catch {
        return url;
      }
    };

    const fieldsToUpdate = ['title', 'author', 'price', 'stock', 'description', 'category'];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        book[field] = req.body[field];
      }
    });


    if (req.files?.book?.[0]) {
      const bookFile = req.files.book[0];
      console.log('New book file received:', bookFile.originalname);

      if (book.bookPath) {
        const oldBookKey = extractKeyFromUrl(book.bookPath);
        console.log('Deleting old book file from S3:', oldBookKey);
        try {
          await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldBookKey,
          }).promise();
          console.log('Old book deleted successfully');
        } catch (err) {
          console.error('Failed to delete old book:', err.message);
        }
      }

      try {
        console.log('Uploading new book file...');
        const uploadBook = await s3.upload({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `books/${Date.now()}-${bookFile.originalname}`,
          Body: bookFile.buffer,
          ContentType: bookFile.mimetype,
        }).promise();

        console.log('New book uploaded:', uploadBook.Location);
        book.bookPath = uploadBook.Location; 
      } catch (err) {
        console.error('Failed to upload new book:', err.message);
      }
    }
    if (req.files?.image?.[0]) {
      const imageFile = req.files.image[0];
      console.log('New image file received:', imageFile.originalname);

      if (book.imagePath) {
        const oldImageKey = extractKeyFromUrl(book.imagePath);
        console.log('Deleting old image from S3:', oldImageKey);
        try {
          await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldImageKey,
          }).promise();
          console.log('Old image deleted successfully');
        } catch (err) {
          console.error('Failed to delete old image:', err.message);
        }
      }

      try {
        console.log('Uploading new image...');
        const uploadImage = await s3.upload({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `images/${Date.now()}-${imageFile.originalname}`,
          Body: imageFile.buffer,
          ContentType: imageFile.mimetype,
        }).promise();

        console.log('New image uploaded:', uploadImage.Location);
        book.imagePath = uploadImage.Location; 
      } catch (err) {
        console.error('Failed to upload new image:', err.message);
      }
    }

    await book.save();
    console.log('Book updated in database successfully');

    return res.status(200).json(new ApiResponse(200, book, 'Book updated successfully'));
  } catch (error) {
    console.error('Error in updateBook:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Error updating book'));
  }
});