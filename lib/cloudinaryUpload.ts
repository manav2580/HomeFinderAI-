import sha1 from "js-sha1";


const CLOUD_NAME = "dugkqpzgq"; // Replace with your Cloudinary Cloud Name
const API_KEY = "367491339432393"; // Replace with your Cloudinary API Key
const API_SECRET = "ONegEBqAeDQBQKY7tRRwTI1q_-E"; // Replace with your Cloudinary API Secret

export const uploadToCloudinary = async (imageUri: string): Promise<{ public_id: string; url: string } | null> => {
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg", // Change based on the image type
    name: "upload.jpg",
  });

  // Generate the signature (You may want to do this on the backend)
  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
  const signature = sha1(stringToSign); // You might need a SHA1 hashing library

  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Upload failed");

    return { public_id: result.public_id, url: result.secure_url };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};