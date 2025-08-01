import { isValidObjectId } from "mongoose";
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

const updateBook = asyncHandler(async (req, res) => {
    //Extract book id, you want to update
    const { bookId } = req.body;
    const { title, author, genre } = req.body;

    //Check if book with this id exist
    if (!bookId || !isValidObjectId(bookId)) {
        throw new ApiError(400, "Invalid book ID");
    }

    //Check if user not give any info
    if (!title || title.trim() === "") {
        throw new ApiError(400, "Title is required");
    }
    if (!author || author.trim() === "") {
        throw new ApiError(400, "Author is required");
    }
    if (!genre || genre.trim() === "") {
        throw new ApiError(400, "Genre is required");
    }

    //Find and update
    const book = await Book.findByIdAndUpdate(
        bookId,
        { title, author, genre },
        { new: true, runValidators: true }
    );
    if (!book) {
        throw new ApiError(404, "Book not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Book updated successfully"));
});

const deleteBook = asyncHandler(async (req, res) => {
    //Extract book id, you want to update
    const { bookId } = req.body;

    //Check if book with this id exist
    if (!bookId || !isValidObjectId(bookId)) {
        throw new ApiError(400, "Invalid book ID");
    }

    //Find and delete
    const book = await Book.findByIdAndDelete(bookId);
    if (!book) {
        throw new ApiError(404, "Book not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Book deleted successfully"));
});

const getAllBooks = asyncHandler(async (req, res) => {
    //Get all books based on query, sort and pagination
    const { page = 1, limit = 10, query, sortBy, sortType } = req.body;

    //Validate pagination parameters, Ensure page an limit are numbers and greater than 0
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    //Validate page number and size
    if (isNaN(pageNumber) || pageNumber < 1) {
        throw new ApiError(400, "Invalid page number");
    }
    if (isNaN(pageSize) || pageSize < 1) {
        throw new ApiError(400, "Invalid page size");
    }

    //Build query, this wil allow to search by title, author or genre
    const queryObject = {};
    if (query) {
        queryObject.$or = [
            {
                title: { $regex: query, $options: "i" },
            },
            {
                author: { $regex: query, $options: "i" },
            },
            {
                genre: { $regex: query, $options: "i" },
            },
        ];
    }

    //Build sort object, If sortBy is provided, sort by the specified field
    //Default to sorting by createdAt in descending order if no sortBy is provided
    const sortObject = {};
    if (sortBy) {
        const sortField = sortBy === "createdAt" ? "createdAt" : "title";
        sortObject[sortField] = sortType === "desc" ? -1 : 1;
    } else {
        sortObject.createdAt = -1; // Default to descending order by createdAt
    }

    // Fetch videos with pagination, sorting, and filtering
    const books = await Book.find(queryObject)
        .sort(sortObject)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .exec();
    if (!books || books.length === 0) {
        throw new ApiError(404, "No books found");
    }

    //Get total count of books for pagination
    const totalCount = await Book.countDocuments(queryObject).exec();
    const totalPages = Math.ceil(totalCount / pageSize);
    const response = {
        books,
        pagination: {
            totalCount,
            totalPages,
            currentPage: pageNumber,
            pageSize,
        },
    };

    return res
        .status(200)
        .json(new ApiResponse(200, response, "Books retrieved successfully"));
});

const getBookById = asyncHandler(async (req, res) => {
    const { bookId } = req.body;

    if (!bookId || !isValidObjectId(bookId)) {
        throw new ApiError(400, "Invalid book ID");
    }

    const book = await Book.findById(bookId);
    if (!book) {
        throw new ApiError(404, "Book not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, book, "Book retrieved successfully"));
});

export { createBook, updateBook, deleteBook, getAllBooks, getBookById };
