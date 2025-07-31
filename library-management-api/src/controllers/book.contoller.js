import { Book } from "../models/book.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createBook = asyncHandler(async (req, res) => {
    const { title, author, genre } = req.body;

    //Check if any field is missing
    if (!title || !author || !genre) {
        throw new ApiError(400, "All fiels are required");
    }

    const book = await Book.create({
        title,
        author,
        genre,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, book, "book added successfully"));
});

const updateBook = asyncHandler(async (req, res) => {});

const deleteBook = asyncHandler(async (req, res) => {});

const getAllBooks = asyncHandler(async (req, res) => {});

const getBookById = asyncHandler(async (req, res) => {});

export { createBook, updateBook, deleteBook, getAllBooks, getBookById };
