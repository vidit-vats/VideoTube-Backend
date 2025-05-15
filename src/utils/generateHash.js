import crypto from "crypto";
import fs from "fs/promises";

export const computeHash = async (filePath) => {
	try {
		const fileBuffer = await fs.readFile(filePath);
		// Creating the SHA-256 Hash
		const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
		return hash;
	} catch (error) {
		throw new Error("Error Computing File Hash: " + error.message);
	}
};
