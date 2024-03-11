import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";
import { Video } from "../models/video.model";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose, { isValidObjectId } from "mongoose";

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
    videoFIle: { url: videoFile.url, public_id: videoFile.public_id },
    thumbnail: { url: thumbnailFile.url, public_id: thumbnailFile.public_id },
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
  const videoId = req.params.videoId;

  //check if id is valid
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }
  //check if the video exists in the db
  const video = Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found. Please try again");
  }

  let videoDetails = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "SubscriberCount",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "videoComment",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        subscriberCount: {
          $size: "$subscriberCount",
        },
        isSunscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscriberCount.subscriber"] },
            then: true,
            else: false,
          },
        },
        totalComments: {
          $size: "$videoComments",
        },
      },
    },
  ]);

  if (!videoDetails) {
    throw new ApiError(404, "Video not found");
  }

  //send response

  return res
    .status(200)
    .json(new ApiResponse(200, videoDetails, "Video fetched succesfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  //check if user is autharized
  //get the video id from the url
  const videoId = req.params.videoId;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id. try again with valid video id");
  }
  //check if the video exists in the db
  const deleteVideo = Video.findById(videoId);
  if (!deleteVideo) {
    throw new ApiError(404, "Video not found");
  }
  //check if the owner is the user
  if (deleteVideo.owner != req.user._id) {
    throw new ApiError(
      400,
      "You dont own the video so you can't delete the video"
    );
  }
  //delete the video from the databse and cloudinary
  const videoFilePublicId = deleteVideo.videoFile.public_id;
  const thumbnailPublicId = deleteVideo.thumbnailFile.public_id;

  if (!videoFilePublicId || !thumbnailPublicId) {
    throw new ApiError(400, "Video or thumbnail publicId not found");
  }

  const removeVideoFromCloudinary = await deleteFromCloudinary(
    videoFilePublicId,
    "video"
  );
  const removeThumbnailFromCloudinary = await deleteFromCloudinary(
    thumbnailPublicId,
    "image"
  );

  if (!removeVideoFromCloudinary || !removeThumbnailFromCloudinary) {
    throw new ApiError(400, "Error while deleting file from cloudinary");
  }

  //delete videofile from db
  const deleteMessage = await deleteVideo.deleteOne();

  if (!deleteMessage) {
    throw new ApiError(400, "Error while deleting video from db");
  }
  //send response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video was deleted successfully"));
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
