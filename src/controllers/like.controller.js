import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
	const { videoId } = req.params;

	const userId = req.user._id;

	const foundVideoId = await Video.findById(videoId);

	if (!foundVideoId)
		throw new ApiError(
			400,
			"No Such Video Exists. Therefore, it can't be liked"
		);

	const deletedLike = await Like.findOneAndDelete({
		video: videoId,
		likedBy: userId,
	});

	if (deletedLike)
		return res.status(200).json(new ApiResponse(200, "Unlike Triggered"));

	const videoLike = await Like.create({
		video: videoId,
		likedBy: userId,
	});
	return res.status(200).json(new ApiResponse(200, videoLike, "Video Liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
	const { commentId } = req.params;
	const userId = req.user._id;

	const commentIdExists = await Comment.findById(commentId);

	if (!commentIdExists)
		throw new ApiError(400, "No such comment exists, Therefore can't be liked");

	const unlikeComment = await Like.findOneAndDelete({
		comment: commentId,
		likedBy: userId,
	});

	if (unlikeComment)
		return res
			.status(200)
			.json(new ApiResponse(200, "Unlike Comment Triggered"));

	const likeComment = await Like.create({
		comment: commentId,
		likedBy: userId,
	});

	return res
		.status(200)
		.json(new ApiResponse(200, likeComment, "Comment Like Triggered"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;
	const userId = req.user._id;

	const tweetIdExists = await Tweet.findById(tweetId);

	if (!tweetIdExists)
		throw new ApiError(400, "No such tweet exists, Therefore can't be liked");

	const unlikeTweet = await Like.findOneAndDelete({
		tweet: tweetId,
		likedBy: userId,
	});

	if (unlikeTweet)
		return res.status(200).json(new ApiResponse(200, "Unlike Tweet Triggered"));

	const likeTweet = await Like.create({
		tweet: tweetId,
		likedBy: userId,
	});

	return res
		.status(200)
		.json(new ApiResponse(200, likeTweet, "Tweet Like Triggered"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
	const loggedInUser = req.user._id;

	const allLikedVideos = await Like.aggregate([
		{
			$match: {
				likedBy: loggedInUser,
			},
		},
	]);

	if (allLikedVideos.length === 0)
		return res.status(200).json(new ApiResponse(200, "No Liked Videos"));

	console.log(allLikedVideos);

	return res
		.status(200)
		.json(
			new ApiResponse(200, allLikedVideos, "Liked Videos Fetched Successfully")
		);
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
