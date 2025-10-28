import {User} from "../models/users.model"
import {Video} from "../models/videos.model"


const  getUserSubscriber = async (username) => {

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


    const  SubscriberDetails = channel[0].subscriberCount
  
    return  SubscriberDetails;
}

const getUserFollowed = async (username) => {
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


    const  FollowedDetails = channel[0].followedCount
    return  FollowedDetails;
}



export { getUserSubscriber }
