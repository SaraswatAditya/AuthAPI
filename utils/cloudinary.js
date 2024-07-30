import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { PassThrough } from "stream";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (buffer) => {
  try {
    if (!buffer) return null;
    const uploadStream = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
        const bufferStream = new PassThrough();
        bufferStream.end(buffer);
        bufferStream.pipe(stream);
      });
    };
    const response = await uploadStream(buffer);
    console.log("File is uploaded on Cloudinary:", response.url);
    return response;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};
export default uploadOnCloudinary;
