import {
    createBook,
    deleteBook,
    updateBook,
    getAllBooks,
    getBookById,
} from "../controllers/book.contoller.js";
import { Router } from "express";
import { isAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const route = Router();

//Routes for all users
route.post("/getAll-books", getAllBooks);
route.get("/getById-book", getBookById);

//Routes for admins only
route.use(verifyJWT, isAdmin);
route.post("/add-book", createBook);
route.patch("/update-book", updateBook); //update-book
route.delete("/delete-book", deleteBook); //delete-book

export default route;
