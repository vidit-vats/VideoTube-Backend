import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { computeHash } from "../utils/generateHash.js";

const getAllVideos = asyncHandler(async (req, res) => {
	const allowedSortingCriteria = [
		"createdAt",
		"updatedAt",
		"views",
		"duration",
	];
	const pageNo = parseInt(req.query.page) || 1;
	const pageLimit = parseInt(req.query.limit) || 4;
	const skip = (pageNo - 1) * pageLimit || 1;
	const userId = req.query.userId;
	const sortBy = req.query.sortBy || "createdAt";
	const sortType = req.query.sortType == "asc" ? -1 : 1;

	// Validate sortBy field
	const finalSortBy = allowedSortingCriteria.includes(sortBy)
		? sortBy
		: "createdAt";

	const matchFilter = userId
		? { owner: mongoose.Types.ObjectId.createFromHexString(userId) }
		: {};

	const matchByID = await Video.aggregate([
		{
			$match: matchFilter,
		},
		{
			$sort: { [finalSortBy]: sortType },
		},
		{
			$skip: skip,
		},
		{
			$limit: pageLimit,
		},
		{
			$project: {
				videoFile: 1,
				thumbnail: 1,
				title: 1,
				description: 1,
				duration: 1,
				views: 1,
				isPublished: 1,
				owner: 1,
				createdAt: 1,
				updatedAt: 1,
				_id: 0,
			},
		},
	]);

	return res
		.status(200)
		.json(new ApiResponse(200, matchByID, "Videos Fetched Successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
	if (!req.body || Object.keys(req.body).length === 0) {
		throw new ApiError(400, "Fields Empty");
	}

	const { title, description, duration } = req.body;
	let views;

	if (req.body.views) views = req.body.views;
	else views = 0;

	const videoFileLocalPath = req.files?.videoFile[0].path;
	const thumbnailFileLocalPath = req.files?.thumbnail[0].path;

	const videoFileHash = await computeHash(videoFileLocalPath);
	const thumbnailFileHash = await computeHash(thumbnailFileLocalPath);

	const existingVideoFile = await Video.findOne({ video_hash: videoFileHash });
	const existingImageFile = await Video.findOne({
		thumbnail_hash: thumbnailFileHash,
	});

	if (existingVideoFile) {
		throw new ApiError(400, "Cannot Upload Same Video Again");
	}

	const videoFileUploadSuccess = await uploadOnCloudinary(videoFileLocalPath);

	if (
		existingImageFile !== null &&
		existingImageFile.thumbnail_hash === thumbnailFileHash &&
		videoFileUploadSuccess
	) {
		const videoDoc = await Video.create({
			videoFile: videoFileUploadSuccess.url,
			thumbnail: existingImageFile.thumbnail,
			owner: req.user._id,
			title: title,
			description: description,
			duration: duration,
			video_hash: videoFileHash,
			thumbnail_hash: existingImageFile.thumbnail_hash,
			isPublished: true,
			views: views,
		});

		const videoResponse = await Video.findById(videoDoc._id).select(
			"-video_hash -_id"
		);

		return res
			.status(200)
			.json(
				new ApiResponse(
					200,
					videoResponse,
					"Video Published Successfully but Image Already Present in Cloud"
				)
			);
	} else {
		const thumbnailFileUploadSuccess = await uploadOnCloudinary(
			thumbnailFileLocalPath
		);

		if (videoFileUploadSuccess && thumbnailFileUploadSuccess) {
			const videoDoc = await Video.create({
				videoFile: videoFileUploadSuccess.url,
				thumbnail: thumbnailFileUploadSuccess.url,
				owner: req.user._id,
				title: title,
				description: description,
				duration: duration,
				video_hash: videoFileHash,
				thumbnail_hash: thumbnailFileHash,
				isPublished: true,
				views: views,
			});

			const videoResponse = await Video.findById(videoDoc._id).select(
				"-video_hash -_id"
			);

			return res
				.status(200)
				.json(
					new ApiResponse(200, videoResponse, "Video Published Successfully")
				);
		} else {
			throw new ApiError(500, "Upload Failed");
		}
	}
});

const getVideoById = asyncHandler(async (req, res) => {
	const { videoId } = req.params;

	const findVideo = await Video.findOne({ _id: videoId }).select(
		"title description views duration"
	);

	if (findVideo) {
		return res
			.status(200)
			.json(new ApiResponse(200, findVideo, "Video Record Found"));
	} else {
		throw new ApiError(400, "No Such Video Record Exists");
	}
});

const updateVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	const { title, description } = req.body;

	const findVideo = await Video.findById(videoId);

	if (!findVideo) throw new ApiError(400, "No Such Video Exists");

	const thumbnailFetched = req?.file?.path;

	let updateFields = {};

	if (title) updateFields.title = title;

	if (description) updateFields.description = description;

	if (thumbnailFetched) {
		const thumbHash = await computeHash(thumbnailFetched);

		if (thumbHash === findVideo.thumbnail_hash) {
			throw new ApiError(401, "Can't upload same thumbnail again");
		}
		const newThumbnail = await uploadOnCloudinary(thumbnailFetched);

		if (newThumbnail) {
			updateFields.thumbnail_hash = thumbHash;
			updateFields.thumbnail = newThumbnail.url;
		}
	}

	const updatedVideo = await Video.findByIdAndUpdate(
		videoId,
		{ $set: updateFields },
		{ new: true }
	);

	return res
		.status(200)
		.json(new ApiResponse(200, updatedVideo, "Details Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.query;
	const video_id = mongoose.Types.ObjectId.createFromHexString(videoId);

	if (!video_id) throw new ApiError(400, "Enter a Valid videoId");

	const delVideo =
		await Video.findByIdAndDelete(video_id).select("title description");

	if (!delVideo)
		throw new ApiError(400, "No Such Video Exists, Enter a valid Video ID");

	return res
		.status(200)
		.json(new ApiResponse(200, delVideo, "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
	const { videoId } = req.params;

	const findVideo = await Video.findByIdAndUpdate(
		videoId,
		[
			{
				$set: {
					isPublished: { $not: "$isPublished" },
				},
			},
		],
		{ new: true }
	);

	if (!findVideo) throw new ApiError(400, "Publish Status Toggle Failed");

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ toggle_status: findVideo.isPublished },
				"Publish Toggle Successful"
			)
		);
});

export {
	getAllVideos,
	publishAVideo,
	getVideoById,
	updateVideo,
	deleteVideo,
	togglePublishStatus,
};
