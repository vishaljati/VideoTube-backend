import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/users.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
try {
        const {channelId} = req.params
        // TODO: toggle subscription
        if (!isValidObjectId(channelId)){
            throw new ApiError(401,"Channel does not exist");
            
        }
        const subscriber = req.user._id
    
        const isSubscribed = await Subscription.findOne({channel:channelId , subscriber:subscriber })
            
        if (isSubscribed) {
            await Subscription.findByIdAndDelete(isSubscribed._id)
            return res.status(200).json(new ApiResponse(200, {},"Channel Unsubscribed"))
        } else {
            await Subscription.create({channel:channelId , subscriber:subscriber })
            return res.status(200).json(new ApiResponse(200, {},"Channel Subscribed"))
        }
} catch (error) {
    console.error("Error:",error);
    return null
    
}
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
try {
        const {channelId} = req.params
        if (!isValidObjectId(channelId)){
            throw new ApiError(401,"Channel does not exist");   
         }
        
         const subscriberDocument = await Subscription.find(
                                           {channel:channelId},
                                           { subscriber : 1 }
                            ) // return array of subscriber id
    
        if (!Array.isArray(subscriberDocument)) {
             throw new ApiError(500,"Server error while fetching subscriber"); 
        }
        const subscriberCount = subscriberDocument.length
    
        if (subscriberCount===0) {
            return res.status(200).json(new ApiResponse(200,{SubscriberList: [] , TotalSubscriber: 0} , "Subscriber details fetched successfully"))
        } else {
            return res.status(200).json(new ApiResponse(200,{SubscriberList: subscriberDocument , TotalSubscriber: subscriberCount} , "Subscriber details fetched successfully"))
        }
    
} catch (error) {
    console.error("ERROR",error);
    return null;
    
}


})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
try {
        const { subscriberId } = req.params
        if (!isValidObjectId(subscriberId)) {
            throw new ApiError(401,"subscriberId invalid");
    
            
        }
        const user = await User.findById(subscriberId)
        if (!user) {
            throw new ApiError(404,"User not found");
            
        }
        const channelList = await Subscription.find({subscriber:user._id} , {channel:1})
    
        if (!Array.isArray(channelList)) {
            throw new ApiError(500,"Something went wrong while fetching channels");
            
        }
    
        if (channelList.length>0) {
            return res.status(200).json(new ApiResponse(200,{channelList},"Subscribed Channel fetched successfully "))
        } else {
             return res.status(200).json(new ApiResponse(200,{},"No subscribed channel found "))
        } 
} catch (error) {
    console.error("Error: ",error);
    return null  
}

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}