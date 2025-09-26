import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.model.js";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    /* 1. Take data from frontend 
       2. Validation :Check Fields are empty 
       3. Cheack user already exists or not : email , username
       4. Check image files , avatar
       5. upload images to cloudinary , check upload success ?
       6. Create a user new object in db 
       7. remove password and refresh token from db response
       8. check for user creation
       9. return response */

    //Taking fields from frontend
    const { username, fullName, email, password } = req.body
    // Checking All fields empty
    if (
        [username, fullName, email, password].some((field) =>
            field?.trim === "")
    ) {
        throw new ApiError(400 , "All fields are required");
     }

    // Checking existed user in db

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "Username or Email already exists")
    }
    /* Note : find method search the match value in db 
    if find true it returns the true . $or opeartor 
    check either username , or email */

    // Checking images
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    /* Note : req.body provides all data , multer provides req.files
    we check 1st prop of avatar->link and asking multer for local path */


    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar is required");

    }
    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(401, "Avatar is required");
    }

    // User creation in DB
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        username: username.toLowerCase(),
        email,
        password
    })
    // Checking if user created or not

    const createdUser = await User.findById(user._id).select(
        "-password -refreshTokens"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");

    }

    // Sending response to frontend

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


})

export { registerUser }