import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
	const videoCount = await Video.aggregate([
		{
			$match: {
				owner: req.user._id,
			},
		},
		{
			$count: "videoCount",
		},
	]);

	const likeCount = await Like.aggregate([
		{
			$match: {
				likedBy: req.user._id,
			},
		},
		{
			$count: "likeCount",
		},
	]);

	const subscribersCount = await Subscription.aggregate([
		{
			$match: {
				channel: req.user._id,
			},
		},
		{
			$count: "subscribersOfChannel",
		},
	]);

	const totalViewsOnVideo = await Video.aggregate([
		{
			$match: {
				owner: req.user._id,
			},
		},
		{
			$group: {
				_id: null,
				totalViews: {
					$sum: "$views",
				},
			},
		},
	]);

	const data = {
		videoCount: videoCount[0].videoCount,
		likeCount: likeCount[0].likeCount,
		subscriberCount: subscribersCount[0].subscribersOfChannel,
		totalViews: totalViewsOnVideo[0].totalViews,
	};

	return res
		.status(200)
		.json(new ApiResponse(200, data, "Channel Stats Returned Successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
	const allVideosOfUser = await Video.find({
		owner: req.user._id,
	});

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				allVideosOfUser,
				"Videos Published By Channel Fetched"
			)
		);
});

export { getChannelStats, getChannelVideos };
