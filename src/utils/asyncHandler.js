
// Creating a utils for error handilng of upcoming function

import { Promise } from "mongoose"

 // Method 1

/* const asyncHandler = (fn) = async (req , res , next)=>{
        try {
            await fn(req , res , next)
        } catch (error) {
            res.status(error.code || 500).json({
                success: false,
                message: error.message 
            })
        }
} */

//Method 2

 const asyncHandler = (requestHandler)=>{
     return (req, res , next)=>{
         Promise.resolve(requestHandler(req,res,next))
         .catch((error)=>next(error))
     }
 }