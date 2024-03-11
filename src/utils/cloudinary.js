import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    //
    return null;
  }
};

const deleteFromCloudinary = async (publicId, resourseType = "image") => {
  try {
    if (!publicId) return null;

    //delete from cloudinary
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourseType,
    });
    console.log("Response: ", response);
    console.log("file delete succesfully from cloudinary");
  } catch (error) {
    console.log(error.message);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
