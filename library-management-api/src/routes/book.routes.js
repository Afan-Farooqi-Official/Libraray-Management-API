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
route.get("/", getAllBooks);
route.get("/:id", getBookById);

//Routes for admins only
route.use(verifyJWT, isAdmin);
route.post("/add-book", createBook);
route.patch("/:id", updateBook); //update-book
route.delete("/:id", deleteBook); //delete-book

export default route;
