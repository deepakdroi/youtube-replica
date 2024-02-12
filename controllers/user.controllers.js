import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (rec, res) => {
  //get data from the client
  //validate those data
  //check if already exist
  // check for images, check for avatar
  // upload files to cloudinary-avatar
  //creat user object- create entry in db
  //remove password and refresh token
  //send response to the client sucess/failure

  const { fullName, email, username, password } = req.body;
  console.log(email);

  if (
    [fullName, email, username, password].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  const existedUser = User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist.");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.LowerCase(),
  });

  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wwrong while registering the user."
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered succesfully"));
});

export { registerUser };
