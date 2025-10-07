import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.model.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const AccessToken = user.generateAccessToken()
        const RefreshToken = user.generateRefreshToken()

        user.refreshTokens = RefreshToken // save refresh token in db
       
        
        await user.save({ validateBeforeSave: false })

        return { AccessToken, RefreshToken }

    } catch (error) {
        console.log("ERROR :", error);
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Token")
    }
}

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
        throw new ApiError(400, "All fields are required");
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

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {

        coverImageLocalPath = req.files.coverImage[0].path;

    }
    /* Note : req.body provides all data , multer provides req.files
    we check 1st prop of avatar->link and asking multer for local path */


    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar is required");

    }
    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = coverImageLocalPath ? await uploadCloudinary(coverImageLocalPath) : null;


    if (!avatar) {
        throw new ApiError(401, "Avatar is required");
    }

    // User creation in DB
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
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

const loginUser = asyncHandler(async (req, res) => {
    /* Logics: 
        1.Take data from req.body
        2. check username or email
        3. find the user in db
        4.password check
        5. provide user access and refresh token
        6.send cookie   */

    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "Username and Email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "User does not exist");

    }

    // checking password

    const isPasswordValid = await user.isPasswordCorrect(password)
    /* User is given by mongoose , any checking
    or methods on db is done by User . But in
        my codebase user is used for checking */

    if (!isPasswordValid) {
        throw new ApiError(401, "Password incorrect");

    }

    const { AccessToken, RefreshToken } = await generateAccessAndRefreshTokens(user._id)

    //Accessing refresh tokens in user 
    const loggedInUser = await User.findById(user._id).select("-password -refreshTokens")

    const options = {
        httpOnly: true,  // cookie can not be modified from frontend , can be modified by server
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", AccessToken, options)
        .cookie("refreshToken", RefreshToken, options)
        .json(new ApiResponse(200,
            {
                user: loggedInUser, RefreshToken, AccessToken
            },
            "User Logged In Successfully"
        )
        )


})


const logOutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(


        req.user._id,
        {
            $set: {
                refreshTokens : undefined
            }
        },
        {
            new: true   // return response will be new response
        }

    )

    const options = {
        httpOnly: true,  // cookie can not be modified from frontend , can be modified by server
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200,
            {},
            "User Logged out"
        ))

})


 const refreshAccessToken= asyncHandler (async (req,res) => {
       
       const cookies = req.cookies || {}   // cookies not cookie
       const body = req.body || {}
       console.log(cookies);
       
      const incomingRefreshToken = 
      cookies.refreshToken || body.refreshToken;
                                     
       console.log("Incoming refresh token:", incomingRefreshToken);
                 
          if (!incomingRefreshToken || typeof incomingRefreshToken !== "string" || !incomingRefreshToken.trim()) {
        throw new ApiError(401, "Unauthorized request: Refresh token missing or invalid");
    }

  try {
        const decodedToken=   jwt.verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET
         )
  
         const user = await User.findById(decodedToken._id)
  
         if (!user) {
           throw new ApiError(401, "Invalid refresh token");
         }
      
         if (incomingRefreshToken !== user?.refreshTokens) {
            throw new ApiError(401, "Refresh token is expired or used");
         }
  
        const option ={
           httpOnly: true,
           secure : true
        }
       
       const {AccessToken , newRefreshToken}=  await generateAccessAndRefreshTokens(user._id)
  
  
        return res.status(200)
        .cookie("accessToken",AccessToken,option)
        .cookie("refreshToken",newRefreshToken ,option)
        .json(
              new ApiResponse(
               200,
               {
                  accessToken : AccessToken,
                  refreshToken: newRefreshToken
               },
               "Access Token Refreshed Successfully"
             )
        )
  } catch (error) {
     throw new ApiError(401, error?.message||"Invalid Refresh Token");
     
  }
 })


const changeCurrentPassword = asyncHandler (async (req ,res)=>{
   
    const { oldPassword , newPassword }=req.body  
    if(!oldPassword || !newPassword){
        throw new ApiError(401 , "Old and New Passwords are required")
    }

   const user = await User.findById(req.user._id)


   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
   if (!isPasswordCorrect) {
      throw new ApiError(400,"Given Password is incorrect");
      
   }
   if (oldPassword===newPassword) {
     throw new ApiError(400,"Old password and new password must not be same");
     
   }

   user.password = newPassword
   await user.save({validateBeforeSave:false})

   return res.status(200).json(new ApiResponse(
      200,
      {},
      "Password Changed Successfully"
   ))


})

const getCurrentUser = asyncHandler (async (req,res)=>{

const user = req.user
 return res
       .status(200)
       .json( 
          new ApiResponse(
                200,
                {user},
                "Current user fetched successfully"
       ))

})

const updateAccountDetails = asyncHandler(async(req,res)=>{

    const { fullName , email } = req.body

    if (!( fullName|| email ) ) {
        throw new ApiError(401,"Full Name or Email is required");
        
    }

   const user= await User.findByIdAndUpdate(
         req.user?._id,
         {
            $set: {
                fullName,
                email
            }
         },
         {
            new : true
         }

    ).select("-password")

 return res 
 .status(200)
 .json(
    new ApiResponse( 
          200 ,
          {user},
          "User details updated successfully"
        )
)


})

const updateUserAvatar = asyncHandler (async(req,res)=>{
    const avatarLocalPath = req.file?.path // single file is needed so used file 
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing");
        
    }

    const avatar = await uploadCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(500,"something went wrong while uploiading on cloudinary")
    } 
    
    const user = await User.findByIdAndUpdate(
          req.user?._id,
         {
            $set:{
                 avatar : avatar.url
              }
         },
         {new : true}
    ).select("-password")
  
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )


})

const updateUserCoverImage = asyncHandler (async(req,res)=>{
    const coverImageLocalPath = req.file?.path // single file is needed so used file 
    if (!coverImageLocalPath) {
        throw new ApiError(400,"Cover Image file is missing");
        
    }

    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(500,"something went wrong while uploiading on cloudinary")
    } 
    
    const user = await User.findByIdAndUpdate(
          req.user?._id,
         {
            $set:{
                 coverImage : coverImage.url
              }
         },
         {new : true}
    ).select("-password")
  
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )


})


const getUserChannelProfile = asyncHandler(async (req,res) => {
    const { username }= req.params
    if (!username?.trim()) {
        throw new ApiError(400,"Username Invalid"); 
    }
 
     // mongodb aggregation piprline
    const channel = await User.aggregate([
           {
            $match:{
                 username: username?.toLowerCase()
            }
         },
         {
           $lookup:{
              from : "subscriptions",
              localField:"_id",
              foreignField:"channel",
              as:"subscribers"
           }
         },
         {
           $lookup:{
              from : "subscriptions",
              localField:"_id",
              foreignField:"subscriber",
              as:"followed"
           }
         },
         {
           $addFields:{

               subscriberCount : {
                  $size:"$subscribers"
               },
               followedCount :{
                 $size: "$followed"
               },
               isSubscribed :{
                  $cond : {
                     if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                     then: true,
                     else: false
                  }
               }

           }
         },
         {
            $project:{
                 
                fullName: 1 ,
                username: 1,
                avatar : 1,
                coverImage: 1,
                subscriberCount: 1,
                followedCount : 1,
                isSubscribed :1 ,
                email : 1,
                createdAt : 1
                 
            }
         }




    ])
    console.log(channel); // check 

    if (!channel?.length) {
        throw new ApiError(404,"Channel is not exist");
        
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200, channel[0],"User channel fetched successfully"
    ))

    

   

 })

 const getWatchHistory = asyncHandler( async (req,res) => {
    
    const user = User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            } // mongoose doesn't work in aggregation pipeline , so id is string here not object id
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField: "videoID",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                             localField:"owner",
                             foreignField: "_id",
                              as:"videoOwner",
                              pipeline:[{
                                  $project:{
                                     fullName:1,
                                     username:1,
                                     avatar:1
                                  }
                              }]

                        }
                    },
                    {
                        $addFields:{
                            $first:"$videoOwner"
                        }
                    }
                ]
            }
        }
    ])

    console.log("USER :",user); // check

    return res.status(200).json(
        new ApiResponse(
            200 , user[0].watchHistory , 
            "Watch History Fetched Successfully"
        )
    )

 })



export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}