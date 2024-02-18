import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshToken = async (user_id) => {
  try {
    const user = await User.findById(user_id);

    const accessToken = generateAccessToken();
    const refreshToken = generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token."
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
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

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist.");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files.coverImage
    ? req.files.coverImage[0]?.path
    : null;

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
    username: username.toLowerCase(),
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

const loginUser = asyncHandler(async (req, res) => {
  // req body-> data
  //check if user exist username or email
  //check if the password is correct
  //access and refresh token
  // send in cookies

  const { email, username, password } = res.body;

  if (!username && !email) {
    throw new ApiError(400, "username or password is required");
  }

  const user = User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookies("accessToken", accessToken, options)
    .cookies("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refrehToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

export { registerUser, loginUser, logoutUser };
