import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
	const { videoId } = req.params;

	const { page, limit } = req.query;

	const pageNo = parseInt(page) || 1;
	const pageLimit = parseInt(limit) || 10;
	const skip = (pageNo - 1) * pageLimit;

	const newVideoId = mongoose.Types.ObjectId.createFromHexString(videoId);

	const findVideoID = await Comment.findOne({ video: newVideoId });

	if (!findVideoID) {
		throw new ApiError(400, "No such Video exists");
	}

	const findAllComments = await Comment.aggregate([
		{
			$match: {
				video: newVideoId,
			},
		},
		{
			$sort: {
				createdAt: 1,
			},
		},
		{
			$skip: skip,
		},
		{
			$limit: pageLimit,
		},
		{
			$project: {
				content: 1,
				video: 1,
				_id: 0,
			},
		},
	]);

	return res
		.status(200)
		.json(
			new ApiResponse(200, findAllComments, "Comments Fetched Successfully")
		);
});

const addComment = asyncHandler(async (req, res) => {
	const { content } = req.body;
	const { videoId } = req.params;

	if (!content || content.trim() === "")
		throw new ApiError(400, "Cannot store empty Comment");

	const findVideoId = await Video.findById(videoId);

	if (!findVideoId) throw new ApiError(400, "No valid videoId supplied.");

	const createdComment = await Comment.create({
		content: content,
		video: mongoose.Types.ObjectId.createFromHexString(videoId),
		owner: req._id,
	});

	if (!createdComment) throw new ApiError(500, "Comment Registry Failed");

	return res
		.status(200)
		.json(
			new ApiResponse(200, createdComment.content, "Comment Added Successfully")
		);
});

const updateComment = asyncHandler(async (req, res) => {
	const { content } = req.body;
	const { commentId } = req.params;

	if (!content || content.trim() === "")
		throw new ApiError(400, "Cannot store empty Comment");

	const findCommentId = await Comment.findById(commentId);

	if (!findCommentId)
		throw new ApiError(
			400,
			"No Comment Previously Exists, Therefore Updation of Comment is not possible."
		);

	const updatedComment = await Comment.findByIdAndUpdate(
		commentId,
		{
			content: content,
		},
		{ new: true }
	);

	if (!updatedComment) throw new ApiError(500, "Comment Updation Failed");

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				updatedComment.content,
				"Comment Updated Successfully"
			)
		);
});

const deleteComment = asyncHandler(async (req, res) => {
	const { commentId } = req.params;

	if (commentId.trim() === "")
		throw new ApiError(400, "CommentId can't be empty");

	const commentToDelete = await Comment.findByIdAndDelete(commentId);

	if (!commentToDelete) throw new ApiError(400, "Comment Deletion Failed");

	return res
		.status(200)
		.json(new ApiResponse(200, "Comment Deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
