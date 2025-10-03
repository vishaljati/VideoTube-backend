// Check user exists or not
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/users.model.js";

// res is not used here . it can be replaced as  _
export const verifyJWT = asyncHandler (async (req , _ , next)=>{
  try {
       // req has access of cookies from app.use(cookieparser())
        
       const token = req.cookies?.accessToken ||
                      req.header("Authorization")?.replace("Bearer ","")
       if(!token){
          throw new ApiError(401,"Unauthorized request");
          
       }
       const decodedToken=jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
       /* This line verifies and decodes a JWT (JSON Web Token) using the
       secret key stored in process.env.ACCESS_TOKEN_SECRET.
       If the token is valid, jwt.verify returns the decoded payload 
       (user info, etc.) and assigns it to decodedToken.
       If the token is invalid or expired, it throws an error.*/

       
      if (!decodedToken) {
          
          throw new ApiError(401,"Invalid Access Token");
          
      }
  
      const user= await User.findById(decodedToken?._id)
                  .select("-password -refreshTokens") 
  
      if (!user) {
          
          throw new ApiError(401,"Invalid Access Token");
          
      }
      req.user=user;
      next()
      
      

  } catch (error) {
     throw new ApiError(401,error?.message||"Invalid Access Token");
     
  }

})