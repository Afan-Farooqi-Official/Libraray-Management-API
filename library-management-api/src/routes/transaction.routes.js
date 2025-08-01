import { Router } from "express";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";
import {
    createTransaction,
    deleteTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
} from "../controllers/transaction.controller.js";

const router = Router();

//Routes for all users
router.route("/borrow-book").post(verifyJWT, createTransaction);
router.route("/return-book").put(verifyJWT, updateTransaction);
router.route("/getAll-transactions").get(verifyJWT, getAllTransactions);

//Routes for admins only
router.use(verifyJWT, isAdmin);

router.route("/getById").get(getTransactionById);
router.route("/delete-transaction").delete(deleteTransaction);

export default router;
