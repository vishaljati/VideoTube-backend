import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from
 "mongoose-aggregate-paginate-v2";

 const commentSchema = new Schema(
    {
        content:{
            required: true,
            type: String
        },
        video:{
           type: mongoose.Schema.Types.ObjectId,
           ref:"Video"
        },
        owner:{
           type: mongoose.Schema.Types.ObjectId,
           ref:"User"
        }
        
    },
    {
        timestamps: true
    }
)

 commentSchema.plugin(mongooseAggregatePaginate)

 export const Comment = mongoose.model("Comment",commentSchema)