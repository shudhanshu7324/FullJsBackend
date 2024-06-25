import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiErrors.js";
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access Token")
    }
}

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

const loginUser = asyncHandler(async (req,res) => {
    // req-body -> data
    // username or email
    // find username or email
    // password check
    // access and refresh token generate
    // send in cookie access and refresh

    const {email,username,password} = req.body;

    if(!username && !email){
        throw new ApiError(400,"username or email is required");
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Password is incorrect")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
        status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,accessToken,refreshToken
                    },
                    "User logged in successfully"
                )
            )
})


const logoutUser = asyncHandler(async(req,res) => {
    // user it is comming from auth middleware
    await User.findOneAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(
            new ApiResponse(200,{},"User loggedOut successfully")
        )
})


const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request");
    }

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if(!user){
        throw new ApiError(401,"invalid refresh token");
    }

    if(incomingRefreshToken !== user?.refreshToken){  
        throw new ApiError(401,"refresh token is expired or used")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const {accessToken,newrefreshToken} = await generateAccessAndRefreshToken(user._id);

    return res.
            status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newrefreshToken,options)
            .json(new ApiResponse(200,{accessToken,refreshToken: newrefreshToken},"Access token refreshed successfully"))
})

export {registerUser, loginUser, logoutUser, refreshAccessToken}