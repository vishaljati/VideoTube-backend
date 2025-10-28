import mongoose,{isValidObjectId} from "mongoose"
import {Video} from "../models/videos.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/likes.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const user = req.user

    //total videos
    const totalVideo = await Video.find({owner:user._id})
    if (!Array.isArray(totalVideo)) {
        throw new ApiError(500,"Server error while fetching video data");
        
    }
    const totalVideoCount = totalVideo? totalVideo.length : 0

    //total video views
    const totalViews = totalVideo.reduce((sum, video) => sum + video.views, 0);

    //total subscribers
    const subscriberDocument = await Subscription.find(
                                           {channel:user._id},
                                           { subscriber : 1 }
                            ) // return array of subscriber id

               
     if (!Array.isArray(subscriberDocument)) {
             throw new ApiError(500,"Server error while fetching subscriber"); 
        }
 
    const totalSubscriber =  subscriberDocument.length

    //total followed
    const followedChannel = await Subscription.find({subscriber:user._id}, {channel:1})
    if (!Array.isArray(followedChannel)) {
             throw new ApiError(500,"Server error while fetching followed channel"); 
        }
    const totalFollowed = followedChannel.length
    //total likes
    const totalLikeDocument = await Like.find({likedBy:user._id})
    if (!Array.isArray(totalLikeDocument)) {
        throw new ApiError(500,"Server error while fetching like data");
        
    }
    const totalLike =totalLikeDocument.length

    return res.status(200).json(new ApiResponse(
        200,
        {totalVideoCount,totalViews,totalSubscriber,totalFollowed,totalLike},
        "Channel stats fetched successfully"
    ))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const user= req.user
    const publishedVideos = await Video.find({owner:user._id, isPublished:true}).select("-videoPublicId -thumbnailPublicId -owner")
    if (!publishedVideos) {
        throw new ApiError(404,"Published videos not found");
        
    }
    
    const unpublishedVideos = await Video.find({owner:user._id, isPublished:false}).select("-videoPublicId -thumbnailPublicId -owner")
    if (!unpublishedVideos) {
        throw new ApiError(404,"Unpublished videos not found");
        
    }
    
    return res.status(200).json(new ApiResponse(
          200, 
          {
           publishedVideos,
           unpublishedVideos
          },
          "All videos fetched successfully"
    ))


})

export {
    getChannelStats, 
    getChannelVideos
    }