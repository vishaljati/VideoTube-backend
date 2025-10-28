import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/videos.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/users.model.js"
import { uploadCloudinary, deleteCloudinary } from "../utils/cloudinary.js";



const getAllVideos = asyncHandler(async (req, res) => {
    // get all video based on query , sortby ,sortType , pagination

    const { page = 1, limit = 10, query, sortby, sortType = "desc", userId } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10)); // cap limit to 100

    // build filter
    const filter = { isPublished: true }; // return only published videos by default

    if (query && String(query).trim().length) {
        const q = String(query).trim();
        filter.$or = [
            { title: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } }
        ];
    }

    if (userId) {
        if (!mongoose.isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        filter.creator = userId; // adjust field name if your model uses a different key
    }

    // build sort
    const dir = String(sortType).toLowerCase() === "asc" ? 1 : -1;
    const allowedSortFields = ["createdAt", "views", "title", "likes"];
    const sortField = allowedSortFields.includes(sortby) ? sortby : "createdAt";
    const sort = { [sortField]: dir };

    const total = await Video.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const skip = (pageNum - 1) * limitNum;

    const videos = await Video.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select("-videoFile -thumbnail"); // exclude heavy fields; adjust as needed

    return res.status(200)
        .json(new ApiResponse(
            200,
            { videos, pagination: { total, page: pageNum, limit: limitNum, totalPages } },
            "Videos fetched successfully"
        ));
});



const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    const videoPath = req.files?.videoFile?.[0].path;
    const thumbnailPath = req.files?.thumbnail?.[0].path;

    if (!videoPath || !thumbnailPath) {
        throw new ApiError(401, "Video and Thumbnail is required");

    }

    const cloudinaryResponseVideo = await uploadCloudinary(videoPath)

    if (!cloudinaryResponseVideo.url) {
        throw new ApiError(500, "Something went wrong while uploading video on cloudinary");

    }

    const cloudinaryResponseThumbnail = await uploadCloudinary(thumbnailPath)


    if (!cloudinaryResponseThumbnail.url) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail on cloudinary");

    }
    const ownerId = req.user._id
    const duration = Math.ceil(cloudinaryResponseVideo.duration)

    const video = await Video.create({
        videoFile: cloudinaryResponseVideo.url,
        thumbnail: cloudinaryResponseThumbnail.url,
        title: title,
        description: description,
        thumbnailPublicId: cloudinaryResponseThumbnail.public_id,
        videoPublicId: cloudinaryResponseVideo.public_id,
        owner:ownerId,
        duration:duration,


    })

    const uploadedVideo = await Video.findById(video._id)

    return res.status(200)
        .json(new ApiResponse(
            200,
            { uploadedVideo },
            "Video Uploaded successfully"
        ))



})

const addVideoView = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate ID
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find and increment view count atomically
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } }, // increment by 1
    { new: true }           // return updated document
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "View count incremented"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const isValidObjectId = mongoose.isValidObjectId(videoId)

    if (!isValidObjectId || !videoId) {
        throw new ApiError(404, "Video not found");
    }


    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found ")
    }
    return res.status(200)
        .json(new ApiResponse(
            200,
            { video },
            "Video fetched successfully"
        ))
})

const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    const { title, description } = req.body;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Video not found");

    }
    
    if (!title || !description) {
        throw new ApiError(400, "Name or description is required");
    }
    const thumbnailLocalPath =  req.file?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");

    }
    const thumbnail = await uploadCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
        throw new ApiError(500, "Something went wrong while uploading on cloudinary")
    }

    //TODO: update video details like title, description
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title:title,
                description: description,
                thumbnail: thumbnail?.url
            }
        },
        {
            new: true
        }
    ).select("-videoFile") // exclude video file  from response

    if (!video) {
        throw new ApiError(404, "Video not found");

    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { video },
            "Video Details and Thumbnail updated successfully"
        ))

})


const deleteVideo = asyncHandler(async (req, res) => {
try {
        const { videoId } = req.params
        //TODO: delete video
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video id");
        }
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }
        
    
      const videoPublicId = video.videoPublicId || video.public_id || video.publicId;
      const thumbnailPublicId = video.thumbnailPublicId || video.thumbnailPublic_id || video.thumbnailPublicId
    
        // 4. delete assets from Cloudinary (do thumbnail + video in parallel if both exist)
      const cloudinaryDeletes = [];
    
      if (videoPublicId) {
        cloudinaryDeletes.push(await deleteCloudinary(videoPublicId));
      }
    
      if (thumbnailPublicId) {
        cloudinaryDeletes.push(await deleteCloudinary(thumbnailPublicId));
      }
    
      const deleteResults = await Promise.allSettled(cloudinaryDeletes);
    
    const failedDeletes = deleteResults.filter(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value));
    
      if (failedDeletes.length > 0) {
        // Decide: either abort DB delete or log and continue.
        // Here we abort and return 500 so admin can investigate.
        console.error("Cloudinary deletion failures:", deleteResults);
        throw new ApiError(500, "Failed to delete files from Cloudinary");
      }
    
       const dbDeleteResult = await Video.deleteOne({ _id: videoId });
    
       
       if (dbDeleteResult.deletedCount === 0) {
        // This is unlikely because we fetched the video earlier, but check anyway
         throw new ApiError(500, "Failed to delete video record from database");
       }
    
        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Video deleted successfully")
            )
    
} catch (error) {
    console.error("ERROR :",error);
    return null
    
}

})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const isValidObjectId = mongoose.isValidObjectId(videoId)

    if (!videoId || !isValidObjectId) {
        throw new ApiError(404, "Video not found");

    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!(video.isPublished)) {
        video.isPublished = true
    } else {
        video.isPublished = false
    }
    const updatedVideo = await video.save({validateBeforeSave:false})
    return res.status(200)
        .json(new ApiResponse(
            200,
            { updatedVideo },
            "Video publish toggled successfully"
        ))

})



export {
    getAllVideos,
    publishAVideo,
    addVideoView,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}