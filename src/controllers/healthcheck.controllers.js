import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    try {
        res.status(200).json(
          new ApiResponse (200,
            {
             status: "success",
             message: "Server is healthy and running ✅",
             timestamp: new Date().toISOString()
            },
            "Health check fetched successfully"
          )
        )
        
    } catch (error) {
       return res.status(500).json(new ApiResponse(
        500,
        {
         status: "error",
         message: "Health check Failed ",
         error: error.message,
        },
        "Server Crashed"

       ))

    }
})

export {
    healthcheck
    }