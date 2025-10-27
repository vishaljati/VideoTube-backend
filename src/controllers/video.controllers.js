import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler";
import { Video } from "../models/videos.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "../models/users.model"
import { uploadCloudinary, deleteCloudinary } from "../utils/cloudinary";

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

    const video = await Video.create({
        videoFile: cloudinaryResponseVideo.url,
        thumbnail: cloudinaryResponseThumbnail.url,
        title: title,
        description: description,
        thumbnailPublicId: cloudinaryResponseThumbnail.public_id,
        videoPublicId: cloudinaryResponseVideo.public_id

    })

    const uploadedVideo = await Video.findById(video._id)

    return res.status(200)
        .json(new ApiResponse(
            200,
            { uploadedVideo },
            "Video Uploaded successfully"
        ))



})


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
    const isValidObjectId = mongoose.isValidObjectId(videoId)
    if (!isValidObjectId || !videoId) {
        throw new ApiError(404, "Video not found");

    }
    const { newTitle, newDescription } = req.body;
    //TODO: update video details like title, description
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: newTitle,
                description: newDescription
            }
        },
        {
            new: true
        }
    ).select("-videoFile -thumbnail") // exclude video file and thumbnail from response

    if (!video) {
        throw new ApiError(404, "Video not found");

    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { video },
            "Video Details updated successfully"
        ))

})

const updatethumbnail = asyncHandler(async (req, res) => {
    // TODO : take new thumbnail , upload on cloudinary , save new link 
    const { videoId } = req.params
    const isValidObjectId = mongoose.isValidObjectId(videoId)

    if (!videoId || !isValidObjectId) {
        throw new ApiError(401, "Video not found");

    }

    const thumbnailLocalPath = req.file?.thumbnail?.[0].path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");

    }
    const thumbnail = await uploadCloudinary(thumbnailLocalPath);
    if (!thumbnail?.url) {
        throw new ApiError(500, "Something went wrong while uploading on cloudinary")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnail?.url
            }
        },
        {
            new: true
        }
    ).select("-videoFile -title -description")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { video },
            "Thumbnail updated successfully"
        ))


})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const isValidObjectId = mongoose.isValidObjectId(videoId)

    if (!videoId || !isValidObjectId) {
        throw new ApiError(404, "Video not found");

    }
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");

    }

    const deleteVideoInDB = await Video.deleteOne(videoId)
    console.log(deleteVideoInDB); // check
    if (!deleteVideoInDB) {
        throw new ApiError(500, "Something went wrong while deleting in db");

    }


    const deleteVideoInCloudinary = await deleteCloudinary(video.videoPublicId)
    const deleteThumbnailInCloudinary = await deleteCloudinary(video.thumbnailPublicId)

    if (!deleteVideoInCloudinary || !deleteThumbnailInCloudinary) {
        throw new ApiError(500, "Something went wrong while deleting in cloudinary");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video deleted successfully")
        )


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
    const videoPublished = video.isPublished
    return res.status(200)
        .json(new ApiResponse(
            200,
            { videoPublished },
            "Video publish toggled successfully"
        ))

})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    updatethumbnail,
    deleteVideo,
    togglePublishStatus
}