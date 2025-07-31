import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const bookSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        author: {
            type: String,
            required: true,
        },
        genre: {
            type: String,
            required: true,
        },
        //Unique identifier for books
        isbn: {
            type: String,
            unique: true,
        },
        status: {
            type: String,
            enum: ["available", "checked out", "reserved"],
            default: "available",
        },
        issuedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

bookSchema.plugin(mongooseAggregatePaginate);

export const Book = mongoose.model("Book", bookSchema);
