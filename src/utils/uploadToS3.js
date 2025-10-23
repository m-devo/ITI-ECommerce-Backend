import s3 from "../../config/s3config.js";

export const uploadToS3 = async (fileBuffer, fileName, folder) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${folder}/${Date.now()}-${fileName.replace(/\s+/g, "_")}`,
    Body: fileBuffer,
    ContentType: fileName.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
  };

  const { Location } = await s3.upload(params).promise();
  return Location; 
};
