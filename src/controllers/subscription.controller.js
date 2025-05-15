import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
	const { channelId } = req.params;

	if (channelId.toString() === req.user._id.toString()) {
		throw new ApiError(400, "Can't subscribe to Yourself");
	}

	const findChannelName = await User.findById(channelId);

	if (!findChannelName) {
		throw new ApiError(400, "Channel does not exist");
	}

	const findIfAlreadySubscribed = await Subscription.findOneAndDelete({
		subscriber: req.user._id,
		channel: findChannelName._id,
	});

	if (findIfAlreadySubscribed) {
		return res
			.status(200)
			.json(
				new ApiResponse(200, findIfAlreadySubscribed, "Channel Unsubscribed")
			);
	}

	const tryingToSubscribe = await Subscription.create({
		subscriber: req.user._id,
		channel: findChannelName._id,
	});

	return res
		.status(200)
		.json(new ApiResponse(200, tryingToSubscribe, "Channel Subscribed"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
	const { channelId } = req.params;

	const subscriberListOfAChannel = await Subscription.aggregate([
		{
			$match: {
				channel: mongoose.Types.ObjectId.createFromHexString(channelId),
			},
		},
		{
			$count: "subscribersOfChannel",
		},
	]);

	const subscriberList =
		subscriberListOfAChannel.length > 0
			? subscriberListOfAChannel[0].subscribersOfChannel
			: 0;

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ SubscribersOfAChannel: subscriberList },
				"Channel Subscribers Returned Successfully"
			)
		);
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
	// Below is the userId i.e. i want to check how many channels we have subscribed to
	// const { subscriberId } = req.params;
	const { channelId } = req.params;

	const getMySubscriptions = await Subscription.aggregate([
		{
			$match: {
				subscriber: mongoose.Types.ObjectId.createFromHexString(channelId),
			},
		},
		{
			$count: "totalSubscriberCount",
		},
	]);

	const subscribersCount =
		getMySubscriptions.length > 0
			? getMySubscriptions[0].totalSubscriberCount
			: 0;

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ TotalChannelsSubscribed: subscribersCount },
				"Subscriber Count Returned Successfully"
			)
		);
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
