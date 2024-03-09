import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { Video } from "../models/video.model";
import { ApiResponse } from "../utils/ApiResponse";

//upload video by user
const uploadVideo = asyncHandler(async (req, res) => {
  //get data from the body
  const { title, description } = req.body;

  //check if data exists
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  //get video and thumbnail path from multer
  const videoLocalPath = req.files?.video[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  //check if video and thumbnail exist
  if (!videoLocalPath) {
    throw new ApiError(400, "Video path is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail path is required");
  }

  //upload video and thumbnail and get their url
  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

  //check if upload was successful
  if (!videoFile) {
    throw new ApiError(400, "Video upload failed. Please try again");
  }
  if (!thumbnailFile) {
    throw new ApiError(400, "Thumbnail upload failed. Please try again");
  }

  //create video object
  const video = await Video.create({
    video: videoFile.url,
    thumbnail: thumbnailFile.url,
    title,
    description,
    owner: req.user._id,
    duration: videoFile.duration,
  });

  // check if the entry was successfull
  if (!video) {
    throw new ApiError(
      400,
      "Record was not updated on the database. Please try again."
    );
  }

  //send response
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video was uploaded succesfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  //check if user is autharized
  //get the video id from the url
  //check if the video exists in the db
  //send response
});

const deleteVideo = asyncHandler(async (req, res) => {
  //check if user is autharized
  //get the video id from the url
  //check if the video exists in the db
  //check if the owner is the user
  //delete the video from the databse and cloudinary
  //send response
});
const updateVideo = asyncHandler(async (req, res) => {
  //check if user is autharized
  //get the video id from the url
  //get data from the body
  //check if the video exists in the db
  //check if user is the owner of the video
  //check if thumbnail exists
  //delete the thumbnail in the cloudinary and upload the new thumbnail
  //check if video exists
  //delete old video from cloudinary and update the new video on cludinary
  //update the database
  //if update is succesfull
  //send response video
});

export { uploadVideo, getVideoById, deleteVideo, updateVideo };
