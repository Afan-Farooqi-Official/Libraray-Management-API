import { isValidObjectId } from "mongoose";
import { Transaction } from "../models/transaction.model.js";
import { Book } from "../models/book.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTransaction = asyncHandler(async (req, res) => {
    const { User: userId, Book: bookId, returnDate } = req.body;

    //Check for required fields
    if (!userId || !bookId || !returnDate) {
        throw new ApiError(400, "All fields required");
    }

    //Validate ObjectIds
    if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(bookId)
    ) {
        throw new ApiError(400, "Invalid User or Book ID");
    }

    //Check if user or book exist
    const user = await User.findById(userId);
    const book = await Book.findById(bookId);
    if (!user || !book) {
        throw new ApiError(404, "User or Book not found");
    }

    const transaction = await Transaction.create({
        User: userId,
        Book: bookId,
        returnDate,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, "Transaction created successfully"));
});

const updateTransaction = asyncHandler(async (req, res) => {
    const { transactionId } = req.body;
    const { returnDate } = req.body;

    //Check if transaction with this id exist
    if (!transactionId || !isValidObjectId(transactionId)) {
        throw new ApiError(400, "Invalid transaction ID");
    }

    if (!returnDate) {
        throw new ApiError(400, "return date is required");
    }

    const transaction = await Transaction.findByIdAndUpdate(
        transactionId,
        { returnDate },
        { new: true, runValidators: true }
    );
    if (!transaction) {
        throw new ApiError(404, "transaction not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "transaction updated successfully"));
});

const deleteTransaction = asyncHandler(async (req, res) => {
    const { transactionId } = req.body;

    if (!transactionId || !isValidObjectId(transactionId)) {
        throw new ApiError(400, "Invalid transaction ID");
    }

    const transaction = await Transaction.findByIdAndDelete(transactionId);
    if (!transaction) {
        throw new ApiError(400, "Transaction not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Transaction deleted successfully"));
});

const getAllTransactions = asyncHandler(async (req, res) => {
    const transactions = await Transaction.find()
        .populate({
            path: "User",
            select: "fullName, email",
        })
        .populate({
            path: "Book",
            select: "title author genre",
        })
        .sort({ borrowedDate: -1 });

    if (!transactions || !transactions.length === 0) {
        throw new ApiError(404, "transactions not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, transactions, "All transaction retireved"));
});

const getTransactionById = asyncHandler(async (req, res) => {
    const { transactionId } = req.body;

    if (!transactionId || !isValidObjectId(transactionId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, transaction, "Transaction retrieved"));
});

export {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getAllTransactions,
    getTransactionById,
};
