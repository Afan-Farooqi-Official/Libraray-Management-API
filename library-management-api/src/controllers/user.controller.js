import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//Generate access and refresh token
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong, while generating access and refresh token"
        );
    }
};

//Register
const registerUser = asyncHandler(async (req, res) => {
    const { userName, email, fullName, role, password } = req.body;
    // console.log("email: ", email);

    //Check validation - having data or empty
    if (
        [userName, email, fullName, role, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    //Check if user already exist
    const existedUser = await User.findOne({
        $or: [{ email }, { userName }],
    });

    if (existedUser) {
        throw new ApiError(400, "User with email or userName already exist");
    }

    /* req.files?.avatar might be undefined, so .avatar[0] crashes if avatar is missing.
    You need to protect the [0] index too. so we used avatar?.[0]?*/

    //Check if we get url of images
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // console.log("avatarurl", avatarLocalPath);

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files?.avatar[0]?.path;
        // console.log("cover image", coverImageLocalPath);
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    //Upload this files to cloundinary
    const avatarurl = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // console.log("cloudinaryAvatar: ", avatarurl);
    // console.log("cloudinaryCoverImage: ", coverImage);
    if (!avatarurl) {
        throw new ApiError(500, "Avatar upload to Cloudinary failed");
    }

    //Create User
    const user = await User.create({
        fullName,
        role,
        avatar: avatarurl,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase(),
    });

    //Check if user created? if so remove password and refreshToken from it
    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!userCreated) {
        throw new ApiError(500, "Something went wrong, while registering user");
    }

    //Return successful response
    return res
        .status(201)
        .json(new ApiResponse(200, "User registered successfully"));
});

//Login
const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;
    // console.log("userName: ", userName);

    //Check is fields empty?
    if (!userName && !email) {
        throw new ApiError(400, "username or email is required");
    }

    //Check is user exist or not
    const user = await User.findOne({
        $or: [{ userName }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "user does not exist!");
    }

    //Check Password
    const isPasswordValid = await user.isPasswordMatch(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "invalid user credentals");
    }

    //Generate Refresh and Access Token
    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    //Send cookies
    const options = {
        httpOnly: true,
        secure: true,
    };

    //Return res
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged In Successfully"
            )
        );
});

//Logout
const logoutUser = asyncHandler(async (req, res) => {
    //Remove refresh token while logging out
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    //For cookies
    const options = {
        httpOnly: true,
        secure: true,
    };

    //Return response
    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"));
});

//Change password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    //Check if this password is correct by user
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordMatch(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(201, "password changed successfully"));
});

//Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(201, req.user, "current user fetched successfully")
        );
});

//Update the detail of account
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "all fields are required");
    }

    //Find and update fullname or email
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email,
            },
        },
        {
            new: true,
        }
    ).select("-password");

    //Return res
    return res
        .status(200)
        .json(new ApiResponse(200, user, "account updated successfully"));
});

//Update avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "user not found");
    }
    //First check if avatar is not missing
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is missing");
    }

    //Delete previous avatar before uploading newOne
    if (user.avatar) {
        // Extract public_id from URL (assuming URL format from Cloudinary)
        const parts = user.avatar.split("/");
        const filename = parts[parts.length - 1]; // e.g., avatar123.png
        const publicId = filename.split(".")[0]; // e.g., avatar123

        await deleteFromCloudinary(publicId);
    }

    /*
For example, if the avatar URL is:
    
https://res.cloudinary.com/demo/image/upload/v123456/avatar123.png
Then after split("/"), you get:

[
  "https:", "", "res.cloudinary.com", "demo", "image",
  "upload", "v123456", "avatar123.png"
]
 const filename = parts[parts.length - 1];
Gets the last part of the array, which is the actual file name:

"avatar123.png"
 const publicId = filename.split(".")[0];
Splits the filename by . to remove the file extension and get only the public_id:

"avatar123"
This publicId is what Cloudinary uses to identify and delete the image. 
*/

    //Uplaod on cloudinary
    const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
    if (!uploadedAvatar) {
        throw new ApiError(500, "something went wrong, while uploading avatar");
    }

    //Update in user
    const updateUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: uploadedAvatar.url,
            },
        },
        { new: true }
    ).select("-password");

    //return res
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updateUser,
                "Avatar image updated successfully"
            )
        );
});

//Update coverImage
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "user not found");
    }

    const coverImageLocalPath = req.file?.path;
    // If no file was uploaded, just return a message
    if (!coverImageLocalPath) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "No cover image uploaded"));
    }

    //Delete previous avatar before uploading newOne
    if (user.coverImage) {
        // Extract public_id from URL (assuming URL format from Cloudinary)
        const parts = user.coverImage.split("/");
        const filename = parts[parts.length - 1]; // e.g., avatar123.png
        const publicId = filename.split(".")[0]; // e.g., avatar123

        await deleteFromCloudinary(publicId);
    }

    //Uplaod on cloudinary
    const updateCoverImage = uploadOnCloudinary(coverImageLocalPath);
    if (!updateCoverImage) {
        throw new ApiError(
            400,
            "something went wrong, while uploading cover image"
        );
    }

    //Update in user
    const updatedUser = await User.findByIdAndUpdate(
        req.user?.id,
        {
            $set: {
                coverImage: updateCoverImage.url,
            },
        },
        { new: true }
    ).select("-password");

    //return res
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "cover image updated successfully"
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
};
