import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from
//  "mongoose-aggregate-paginate-v2";

 const playlistSchema = new Schema (
     {
        name:{
            type:String,
            require : true
        },
        description:{
            type:String,
            require : true
        },
        video:[  {
                    type: mongoose.Schema.Types.ObjectId,
                    ref:"Video"
                 }   
         ]   ,
        owner:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        }

     },
     {
        timestamps: true
     }
 )

//  playlistSchema.plugin(mongooseAggregatePaginate)

 export const Playlist = mongoose.model("Playlist",playlistSchema)