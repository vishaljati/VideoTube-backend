import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/likes.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const {userId}= req.user._id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404,"Video not found");
        
    }
try {
        const existedLike = await Like.findOne({likedBy:userId,video:videoId})
        if(existedLike){
           await Like.deleteOne({_id:existedLike?._id})
           return res.status(200).json(new ApiResponse(200,{ message: "Like removed",liked: false,},"Like removed"))
        }else{
           await Like.create({likedBy:userId,video:videoId})
           return res.status(200).json(new ApiResponse(200,{ message: "Like Added",liked: true,},"Like Added"))
        }
} catch (error) {
    console.error("Error in toggleVideoLike:", error);
    res.status(500).json({ success: false, message: "Server error while toggling like" });
    return null
  }
    

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const {userId}= req.user._id

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404,"Comment not found");
        
    }
try {
        const existedLike = await Like.findOne({likedBy:userId,comment:commentId})
        if(existedLike){
           await Like.deleteOne({_id:existedLike?._id})
           return res.status(200).json(new ApiResponse(200,{ message: "Like removed",liked: false,},"Like removed"))
        }else{
           await Like.create({likedBy:userId,comment:commentId})
           return res.status(200).json(new ApiResponse(200,{ message: "Like Added",liked: true,},"Like Added"))
        }
} catch (error) {
    console.error("Error in toggleVideoLike:", error);
    res.status(500).json({ success: false, message: "Server error while toggling like" });
    return null
  }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
        const {userId}= req.user._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404,"Comment not found");
        
    }
try {
        const existedLike = await Like.findOne({likedBy:userId,tweet:tweetId})
        if(existedLike){
           await Like.deleteOne({_id:existedLike?._id})
           return res.status(200).json(new ApiResponse(200,{ message: "Like removed",liked: false,},"Like removed"))
        }else{
           await Like.create({likedBy:userId,tweet:tweetId})
           return res.status(200).json(new ApiResponse(200,{ message: "Like Added",liked: true,},"Like Added"))
        }
} catch (error) {
    console.error("Error in toggleVideoLike:", error);
    res.status(500).json({ success: false, message: "Server error while toggling like" });
    return null
  }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {userId}=req.user._id
    if (!userId) {
        throw new ApiError(400,"User authentication invalid");
        
    }
   try {
     const likedVideos= await Like.find(
         { likedBy:userId },
         {
             video: 1
         }
     ).sort({ createdAt: -1 })
     if (likedVideos?.length<0) {
         throw new ApiError(500,"Something went wrong while fetching likes");
         
     }
     if (likedVideos?.length===0) {
         return res.status(200).json(new ApiResponse(200,{},"No liked video found"))
     }
 
     return res.status(200).json(new ApiResponse(200,{likedVideos, likeCount:likedVideos.length},"Liked video fetched successfully"))
   } catch (error) {
       console.error("Error in Fetching liked video:", error);
       res.status(500).json({ success: false, message: "Server error while fetching liked videos" });
       return null
   }

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}