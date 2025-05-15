import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
	const { name, description } = req.body;

	if (name.trim() === "" || description.trim() === "")
		throw new ApiError(400, "Name/Description can't be empty");

	const findIfPlaylistExists = await Playlist.findOne({
		name: name,
	});

	if (findIfPlaylistExists) {
		throw new ApiError(400, "Playlist already exists");
	}

	const createdPlaylist = await Playlist.create({
		name: name,
		description: description,
		owner: req.user._id,
	});

	return res
		.status(200)
		.json(new ApiResponse(200, createdPlaylist, "Playlist Created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
	const { userId } = req.params;

	if (!mongoose.isValidObjectId(userId))
		throw new ApiError(
			400,
			"No such UserID exists. Therefore, no such playlist exists"
		);

	const getPlaylistsOfUser = await Playlist.find({
		owner: mongoose.Types.ObjectId.createFromHexString(userId),
	}).select("name videos");

	console.log(getPlaylistsOfUser);

	if (getPlaylistsOfUser.length !== 0)
		return res
			.status(200)
			.json(
				new ApiResponse(
					200,
					getPlaylistsOfUser,
					"Playlists fetched successfully"
				)
			);
	else throw new ApiError(400, "No Such Playlist exists");
});

const getPlaylistById = asyncHandler(async (req, res) => {
	const { playlistId } = req.params;

	if (!mongoose.isValidObjectId(playlistId))
		throw new ApiError(400, "Not a valid Playlist ID");

	const foundPlaylist = await Playlist.findById(playlistId);

	if (foundPlaylist)
		return res
			.status(200)
			.json(new ApiResponse(200, foundPlaylist, "Playlist Fetched"));
	else throw new ApiError(400, "No Such Playlist Exists");
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
	const { playlistId, videoId } = req.params;

	if (
		!mongoose.isValidObjectId(playlistId) ||
		!mongoose.isValidObjectId(videoId)
	)
		throw new ApiError(400, "No 12-digit video/playlist ID provided");

	const playlist = await Playlist.findById(playlistId);

	if (playlist.videos.includes(videoId))
		throw new ApiError(400, "Video already Exists");

	const saveVideoInPlaylist = await Playlist.findByIdAndUpdate(
		playlistId,
		{
			$push: {
				videos: videoId,
			},
		},
		{
			new: true,
		}
	);

	return res
		.status(200)
		.json(
			new ApiResponse(200, saveVideoInPlaylist, "Video added in the playlist")
		);
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
	const { playlistId, videoId } = req.params;

	if (
		!mongoose.isValidObjectId(playlistId) ||
		!mongoose.isValidObjectId(videoId)
	)
		throw new ApiError(400, "No 12-digit video/playlist ID provided");

	const playlist = await Playlist.findById(playlistId);

	if (playlist.videos.length === 0)
		throw new ApiError(400, "Playlist is empty");
	else if (playlist.videos.includes(videoId)) {
		const removeVideo = await Playlist.findByIdAndUpdate(
			playlistId,
			{
				$pull: {
					videos: videoId,
				},
			},
			{ new: true }
		);

		console.log(removeVideo);

		return res
			.status(200)
			.json(new ApiResponse(200, removeVideo, "Video Deletion Successful"));
	} else throw new ApiError(400, "No such Video Exists in the playlist");
});

const deletePlaylist = asyncHandler(async (req, res) => {
	const { playlistId } = req.params;

	if (!mongoose.isValidObjectId(playlistId))
		throw new ApiError(
			400,
			"No Such PlaylistID exists. Therefore, can't be deleted"
		);

	const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
	console.log(deletedPlaylist);

	if (deletedPlaylist === null) {
		throw new ApiError(400, "No Playlist Exists");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, deletedPlaylist, "Playlist Deleted"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
	const { playlistId } = req.params;
	const { name, description } = req.body;

	if (!mongoose.isValidObjectId(playlistId))
		throw new ApiError(400, "Not a valid PlaylistID");

	if (name.trim() === "") throw new ApiError(400, "No Name Provided");
	else if (description.trim() === "")
		throw new ApiError(400, "No Description Provided");

	const findPlaylist = await Playlist.findByIdAndUpdate(
		playlistId,
		{
			name: name,
			description: description,
		},
		{
			new: true,
		}
	);

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				findPlaylist,
				"Name and Description Changed Successfully"
			)
		);
});

export {
	createPlaylist,
	getUserPlaylists,
	getPlaylistById,
	addVideoToPlaylist,
	removeVideoFromPlaylist,
	deletePlaylist,
	updatePlaylist,
};
