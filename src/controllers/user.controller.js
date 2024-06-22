import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiErrors.js";
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req,res) => {
    // get users details from frontend using req.body
    // validation - not empty
    // check if user already exist using username or email
    // check for image and avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {username,email,fullName,password} = req.body;

    // if(fullName === ""){
    //     throw new ApiError(400, "fullname is required")
    // }

    if(
        [fullName,username,email,password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{username,email}]
    })

    if(existedUser){
        throw new ApiError(409, "user already exist with this username or email")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar image is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"avatar image is required");
    }


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering user")
    }

    return res.status(201).json(new ApiResponse(200,createdUser,"User register successfully"))
})

export {registerUser}