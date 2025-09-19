import {v2 as cloudinary} from "cloudinary"
import fs from 'fs'

cloudinary.config({
      
       cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
       api_key: process.env.CLOUDINARY_API_KEY,
       api_secret: process.env.CLOUDINARY_API_SECRET,

});


const uploadCloudinary = async function (localFilePath) {
    
    try {
         if(!localFilePath){
            return console.log("File path not found");   
         }

         // Uploading file on cloudinary
        const response = await cloudinary.uploader.upload
        (localFilePath , {
             resource_type: "auto"
        })
         
        console.log("File Uploaded on Cloudinary Successfully!", response.url);
        return response

    } catch (error) {
        // remove the locally saved temp file as upload operation failed
        fs.unlinkSync(localFilePath) ; 
        return null


    }
}