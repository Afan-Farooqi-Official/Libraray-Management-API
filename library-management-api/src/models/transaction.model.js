import mongoose, { Schema } from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const bookSchema = new Schema(
    {
        User: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        Book: {
            type: Schema.Types.ObjectId,
            ref: "Book",
        },
        borrowedDate: {
            type: Date,
            default: Date.now,
        },
        returnDate: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    // If `this` context not available, allow validation (skip it)
                    if (!this || !this.borrowedDate) return true;

                    return value >= this.borrowedDate;
                },
                message: "Return date cannot be before borrowed date",
            },
        },
    },
    {
        timestamps: true,
    }
);

export const Transaction = mongoose.model("Transaction", bookSchema);
