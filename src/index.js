import dotenv from "dotenv";
dotenv.config({
    path: './env'
})

import mongoose from "mongoose";
import connectDB from "./db/dbconnect.js";
connectDB();


