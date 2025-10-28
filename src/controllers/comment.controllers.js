import mongoose ,{isValidObjectId} from "mongoose";
import {asyncHandler} from "../utils/asyncHandler.js"
import { Comment } from "../models/comments.model.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    
    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Convert page and limit to numbers and ensure valid values
    const pageNumber = Math.max(1, parseInt(page))
    const limitNumber = Math.max(1, Math.min(100, parseInt(limit)))
    
    const skip = (pageNumber - 1) * limitNumber

    // Get comments with pagination
    const comments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limitNumber)
        .populate("owner", "username fullName avatar") // Get user details
        
    // Get total comments count for pagination info
    const totalComments = await Comment.countDocuments({ video: videoId })
    
    // Calculate total pages
    const totalPages = Math.ceil(totalComments / limitNumber)

    if (!comments.length) {
        return res.status(200).json(
            new ApiResponse(200, 
                { 
                    comments: [], 
                    pagination: {
                        page: pageNumber,
                        limit: limitNumber,
                        totalComments,
                        totalPages
                    }
                }, 
                "No comments found for this video"
            )
        )
    }

    return res.status(200).json(
        new ApiResponse(200, 
            { 
                comments,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    totalComments,
                    totalPages
                }
            }, 
            "Comments fetched successfully"
        )
    )

})


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content }= req.body
    const   ownerId = req.user._id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404,"Video not found");
        
    }
     if (!content) {
        throw new ApiError(401,"Comment content is required");
        
    }

    const comment = await Comment.create({
         content,
         video:videoId,
         owner:ownerId
    })
      if (!comment) {
        throw new ApiError(500,"Something went wrong while creating comment");
        
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{comment},"Comment created successfully"))

})


const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { newContent }= req.body
    const { commentId } = req.params
    if (!newContent) {
        throw new ApiError(401,"Comment content is required");
        
    }
    if (!commentId) {
        throw new ApiError(401,"Comment not found");
        
    }
    const updatingComment =await Comment.findByIdAndUpdate(
                           commentId,
                           {
                            $set:{
                                content:newContent
                            }
                           },
                           {
                            new: true
                           }
      ).select("-owner -video")
    
      if (!updatingComment) {
        throw new ApiError(500,"DB Error :Comment updation failed");
        
      }
     return res
            .status(200)
            .json(new ApiResponse(200,{updatingComment},"Comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) {
        throw new ApiError(401,"Comment not found");
        
    }
    const deletingComment = await Comment.findByIdAndDelete(commentId)

    if (!deletingComment) {
        throw new ApiError(500,"Something went wrong while deleting comment");
        
    }

    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }