import mongoose from "mongoose";
import {DB_NAME} from "../constant.js";

 const connectDB = async () => {
      try {
         const connectionInstant = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
         // console.log(connectionInstant);
         console.log("\n MONGODB Connected Successfully!! \n DB HOST :" ,`${connectionInstant.connection.host}`);
          
      } catch (error) {
         console.log("MONGODB Connection FAILED",error);
         process.exit(1);
         
      }
    
 }

 export { connectDB };