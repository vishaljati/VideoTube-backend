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


  export default router;