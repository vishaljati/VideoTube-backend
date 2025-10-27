import { Router } from "express";
import {    
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    updatethumbnail,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controllers"

import {verifyJWT} from "../middlewares/auth.middlewares"
import {upload} from "../middlewares/multer.middlewares"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/")
        .get(getAllVideos)
        .post(
            upload.fields([
                {
                    name:"videoFile",
                    maxCount:1
                },
                {
                    name:"thumbnail",
                    maxCount:1
                }
            ]),
            publishAVideo
          )

router.route("/:videoId")
        .get(getVideoById)
        .delete(deleteVideo)
        .patch(updateVideo)
        .patch(upload.single("thumbnail"),updatethumbnail)

router.route("/toggle/publish/:videoId")
        .patch(  togglePublishStatus )

export default router;