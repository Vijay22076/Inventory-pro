import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload buffer directly to Cloudinary (for Vercel)
const uploadBufferToCloudinary = async (buffer, filename) => {
    try {
        if (!buffer) return null;

        const isCloudinaryConfigured =
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_KEY !== "1234567890" &&
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_CLOUD_NAME !== "demo" &&
            process.env.CLOUDINARY_API_SECRET &&
            process.env.CLOUDINARY_API_SECRET !== "abcdefghijklmnopqrstuvwxyz";

        if (isCloudinaryConfigured) {
            try {
                return await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: "auto",
                            public_id: filename ? path.parse(filename).name : undefined,
                            folder: "ims-uploads",
                        },
                        (error, result) => {
                            if (error) {
                                console.error("Cloudinary Buffer Upload Error:", error);
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        }
                    );
                    uploadStream.end(buffer);
                });
            } catch (cloudErr) {
                console.warn("Cloudinary upload failed, falling back to local storage:", cloudErr.message);
            }
        }

        // Local fallback: save buffer to public/temp
        const tempDir = path.resolve("./public/temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const ext = filename ? path.extname(filename) : ".png";
        const tempFilename = `upload-${Date.now()}${ext}`;
        const tempPath = path.join(tempDir, tempFilename);
        fs.writeFileSync(tempPath, buffer);

        const port = process.env.PORT || 3001;
        const localUrl = `http://localhost:${port}/temp/${tempFilename}`;
        console.log(`📁 File saved locally: ${localUrl}`);
        return {
            url: localUrl,
            secure_url: localUrl,
            public_id: tempFilename,
        };
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
};

// Original function for local development (when files are saved to disk)
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Check if file exists
        if (!fs.existsSync(localFilePath)) {
            console.error(`File not found: ${localFilePath}`);
            return null;
        }

        const isCloudinaryConfigured =
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_KEY !== "1234567890" &&
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_CLOUD_NAME !== "demo" &&
            process.env.CLOUDINARY_API_SECRET &&
            process.env.CLOUDINARY_API_SECRET !== "abcdefghijklmnopqrstuvwxyz";

        if (isCloudinaryConfigured) {
            try {
                // Upload the file to cloudinary
                const response = await cloudinary.uploader.upload(localFilePath, {
                    resource_type: "auto",
                    folder: "ims-uploads",
                });

                // Remove the locally saved temporary file
                fs.unlinkSync(localFilePath);
                return response;
            } catch (cloudErr) {
                console.warn("Cloudinary upload failed, falling back to local file:", cloudErr.message);
            }
        }

        // Local fallback: keep file in public/temp and return its URL
        const filename = path.basename(localFilePath);
        const port = process.env.PORT || 3001;
        const localUrl = `http://localhost:${port}/temp/${filename}`;
        console.log(`📁 File saved locally: ${localUrl}`);
        return {
            url: localUrl,
            secure_url: localUrl,
            public_id: filename,
        };
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

// Function that works in both local and Vercel environments
const uploadToCloudinary = async (file) => {
    try {
        if (!file) return null;

        // If file has buffer property (multer memory storage), use buffer upload
        if (file.buffer) {
            return await uploadBufferToCloudinary(
                file.buffer,
                file.originalname
            );
        }

        // If file has path property (multer disk storage), use file upload
        if (file.path) {
            return await uploadOnCloudinary(file.path);
        }

        // If it's just a file path string
        if (typeof file === "string") {
            return await uploadOnCloudinary(file);
        }

        throw new Error("Invalid file format provided");
    } catch (error) {
        console.error("Upload to Cloudinary failed:", error);
        return null;
    }
};

export { uploadOnCloudinary, uploadBufferToCloudinary, uploadToCloudinary };
