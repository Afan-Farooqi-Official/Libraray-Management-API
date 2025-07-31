import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer", "");

        if (!token) {
            throw new ApiError(401, "Unauthrized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        // console.log("user role from DB:", user.role);
        if (!user) {
            throw new ApiError(401, "Invalid Access token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export const isAdmin = asyncHandler(async (req, res, next) => {
    try {
        if (req.user?.role.toLowerCase() !== "admin") {
            throw new ApiError(403, "Access denied. Admins only!");
        }
        next();
    } catch (error) {
        throw new ApiError(500, error?.message);
    }
});
