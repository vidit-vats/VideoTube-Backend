import mongoose, { Mongoose } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
// import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
	const { content } = req.body;

	if (!req.body.content) {
		throw new ApiError(401, "No Content Provided");
	}

	const savedContent = await Tweet.create({
		content: content,
		owner: req.user._id,
	});

	return res
		.status(200)
		.json(new ApiResponse(201, savedContent, "Tweet Registered"));
});

const getUserTweets = asyncHandler(async (req, res) => {
	const { userId } = req.params;

	if (userId !== req.user.username) {
		throw new ApiError(400, "You cannot read other people tweets");
	}

	const allTweets = await Tweet.find({ owner: req.user._id });

	if (!allTweets) {
		throw new ApiError(400, "Tweet Fetch Failed");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, allTweets, "Tweets Fetched Successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
	if (!req.params.tweetId) {
		throw new ApiError(400, "No Tweet ID provided");
	}

	if (!req.body.content) {
		throw new ApiError(400, "Empty Tweet Not Possible");
	}

	const tweetId = mongoose.Types.ObjectId.createFromHexString(
		req.params.tweetId
	);

	const UserWhoTweets = await Tweet.findById(tweetId);

	console.log(UserWhoTweets);

	if (UserWhoTweets.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(400, "You cannot edit any other user's tweet");
	}

	const newContent = req.body.content;

	const foundTweet = await Tweet.findOneAndUpdate(
		{ _id: tweetId },
		{ content: newContent },
		{ new: true }
	);

	if (!foundTweet) {
		throw new ApiError(400, "Tweet Updation Failed");
	} else {
		return res
			.status(200)
			.json(new ApiResponse(200, foundTweet, "Tweet Updation Successfull"));
	}
});

const deleteTweet = asyncHandler(async (req, res) => {
	if (!req.params.tweetId) {
		throw new ApiError(400, "No Tweet ID provided");
	}

	const tweetId = mongoose.Types.ObjectId.createFromHexString(
		req.params.tweetId
	);

	const UserWhoTweets = await Tweet.findById(tweetId);

	if (UserWhoTweets.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(400, "Cannot Delete Other Person's Tweet");
	}

	const finalResult = await Tweet.findByIdAndDelete(tweetId);

	if (!finalResult) {
		throw new ApiError(400, "No Such Tweet exists");
	} else {
		return res
			.status(200)
			.json(new ApiResponse(200, finalResult, "Tweet Deleted Successfully"));
	}
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
