import { Router } from "express";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
  } from "../controllers/tweet.controllers"

  import { verifyJWT } from "../middlewares/auth.middlewares"
  

  const router = Router()

  router.use(verifyJWT)

  router.route("/").post(createTweet)
  router.route("/user/:userId").get(getUserTweets)
  router.route("/:tweetId").patch(updateTweet).delete(deleteTweet)


  export default router;