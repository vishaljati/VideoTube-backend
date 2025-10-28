import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlists.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/videos.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    const ownerId = req.user?._id
    if (!name || !description) {
        throw new ApiError("Both name and description required");
        
    }
    const { video } =req.body
    if (!Array.isArray(video)) {
        throw new ApiError(500,"Server error to extract video array");
    }
    if (!video) {
        throw new ApiError(401,"Video required to create playlist");
        
    }
    const playlist = await Playlist.create({
               name,
               description,
               owner:ownerId,
               video: video

    })

    const createdPlaylist = await Playlist.findById(playlist._id)
   if (!createdPlaylist) {
     throw new ApiError(500,"Server error to creating playlist");
   }

   return res.status(200)
            .json(new ApiResponse(200 , {createdPlaylist},"Playlist created successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!userId) {
        throw new ApiError(401,"User authentication invalid");
        
    }

    const playlists = await Playlist.find({owner:userId}).select("-owner")
    if (playlists.length<=0) {
        throw new ApiError(404,"Playlist not found");
    }
    return res.status(200)
     .json(new ApiResponse(
         200,
         {playlists},
         "Playlists fetched successfully for this user"
     ))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404,"Playlist not found");
        
    }
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404,"Playlist not found");
    }
    return res.status(200)
               .json(new ApiResponse(
                  200,
                  {playlist},
                  "Playlist fetched successfully"
               ))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401,"Playlist not found")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401,"Video not found")
    }

    const playlist = await Playlist.findById(playlistId).select("-name -description -owner")
    if (!playlist) {
        throw new ApiError(404,"Playlist not found")
    }
    const newVideo = await Video.findById(videoId)
    if (!newVideo) {
        throw new ApiError(404,"Video not found")
    }
    
    playlist.video.push(newVideo._id)
    if (!playlist.video.includes(newVideo._id)) {
         throw new ApiError(500,"Server error : failed video adding")
    }
    await playlist.save({ validateBeforeSave: false })

    return res.status(200)
           .json(new ApiResponse(200,{playlist},"Video added successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404,"Playlist not found")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401,"Video not found")
    }
    const playlist = await Playlist.findById(playlistId).select("-name -description -owner")
    if (!playlist) {
        throw new ApiError(404,"Playlist not found")
    }
    const deletingVideo = await Video.findById(videoId)
    if (!deletingVideo) {
        throw new ApiError(404,"Video not found")

    }
    if (!playlist.video.includes(deletingVideo._id)) {
         throw new ApiError(404,"Video not found in playlist")
    }
    const indexVideo = playlist.video.indexOf(deletingVideo._id)

    if (indexVideo > -1) {
        playlist.video.splice(indexVideo, 1);
        await playlist.save({ validateBeforeSave: false });
    }

    return res.status(200)
              .json(new ApiResponse(
                 200,
                 {playlist},
                 "Video deleted successfully"
              ))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404,"Playlist not found")
    }
    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if (!playlist) {
        throw new ApiError(500,"Server error while deleting playlist")
    }
    
    return res.status(200)
            .json(new ApiResponse(
                200,
                {},
                "Playlist deleted successfully"
            ))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404,"Playlist not found")
    }
    if (!name || !description) {
        throw new ApiError(404,"Name and Description required")
    }
    const playlist = await Playlist.findByIdAndUpdate(
          playlistId,
          {
            $set:{
                name:name,
                description:description
            }
          },
          { new:true }
    )

    if (!playlist) {
        throw new ApiError(404,"Playlist not found");
        
    }

    return res.status(200)
           .json(new ApiResponse(
             200,
             { playlist },
             "Playlist details updated successfully"
           ))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}