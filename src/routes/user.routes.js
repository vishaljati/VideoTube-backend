import { Router } from "express";
import { registerUser ,
         loginUser ,
         logOutUser,
         refreshAccessToken, 
         changeCurrentPassword,
         getCurrentUser,
         updateAccountDetails,
         updateUserAvatar,
         updateUserCoverImage,
         getUserChannelProfile,
         getWatchHistory,
         getUserById } from "../controllers/user.controllers.js";
import  { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"

const router= Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/get-user").get(getUserById)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").patch(verifyJWT ,  upload.single("avatar") , updateUserAvatar)
router.route("/cover-image").patch(verifyJWT ,  upload.single("coverImage") , updateUserCoverImage)

//user channel profile , in url : users/api/v1/c/username (: not req)
router.route("/c/:username").get(verifyJWT , getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)



export default router;