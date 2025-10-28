import mongoose , {isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/users.model.js"
import { Tweet } from "../models/tweets.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
     const ownerId = req.user._id
     const { content } = req.body

     if (!content) {
        throw new ApiError(401,"Tweeter content is required");
        
     }

     const tweet = await Tweet.create({
         owner:ownerId,
         content:content
      })

     const uploadedTweet = await Tweet.findById(tweet._id)
     if (!uploadedTweet) {
        throw new ApiError(500,"Something went wrong while creating tweet");
        
     }

     return res.status(200)
               .json(new ApiResponse(
                  200,
                  {uploadedTweet},
                  "Tweeter created successfully"
                ))

   
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId }= req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

     const tweets = await Tweet.find({ owner: userId })
     .sort({ createdAt: -1 }) // Sort by most recent first
     .populate("owner", "username") // Optionally populate owner details
     .select("-__v"); // Exclude version key if not needed

    if (!tweets.length) {
        return res.status(404).json(new ApiResponse(404, [], "No tweets found for this user"));
    }

    return res.status(200).json(new ApiResponse(200, { tweets }, "User tweets fetched successfully"));

})


const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { updatedContent } = req.body

    if (!updatedContent) {
        throw new ApiError(401,"Content is required");
        
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
                            tweetId,
                            {
                                $set:{
                                    content:updatedContent
                                }
                            }
                        ).select("-owner")

    if (!updatedTweet) {
        throw new ApiError(500,"Tweet Update failed ");
        
    }

    return res
            .status(200)
            .json(new ApiResponse(200,{updatedContent},"Tweet updated successfully"))
})


const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
        const { tweetId } = req.params
        if (!isValidObjectId(tweetId)) {
            throw new ApiError(401,"Tweet is not found");
            
        }
        const deleteATweet = await Tweet.findByIdAndDelete(tweetId)
        if (!deleteATweet) {
             throw new ApiError(500,"Something went wrong while deleting tweet");
        }

        return res.status(200)
        .json(new ApiResponse(200,{},"Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}