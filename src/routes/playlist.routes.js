import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// routes

router.route("/").post(createPlaylist)

router.route("/users/:userId").get(getUserPlaylists)

router.route("/:playlistId").get(getPlaylistById)
                            .patch(updatePlaylist)
                            .delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").post(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").post(removeVideoFromPlaylist)


export default router;