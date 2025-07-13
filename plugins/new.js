const { cmd } = require("../command");
const axios = require("axios");
const path = require("path");

// Define the command for downloading videos as MP4
const mp4videoCommand = {
  pattern: "tharu", // Command pattern trigger
  category: "download",
  filename: __filename,
  desc: "Download any video as an MP4 file."
};

// Register the command with the bot
cmd(mp4videoCommand, async (conn, mek, m, { from, q, reply }) => {
  try {
    // Check if URL is provided
    if (!q) {
      return reply("❌ Please provide a video URL.");
    }

    // Send a HEAD request to get headers of the URL
    const headResponse = await axios.head(q);

    // Default filename
    let filename = "video.mp4";

    // Get Content-Disposition header to check for filename
    const contentDisposition = headResponse.headers["content-disposition"];

    if (contentDisposition && contentDisposition.includes("filename=")) {
      // Extract filename from header if available
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    } else {
      // If no filename in headers, derive filename from URL
      filename = path.basename(q.split('?')[0]);
    }

    // Prepare the video message payload
    const videoPayload = {
      url: q
    };

    const messageOptions = {
      document: videoPayload,
      mimetype: "video/mp4",
      fileName: filename
    };

    // Send the video as a message
    await conn.sendMessage(from, messageOptions, { quoted: mek });
  } catch (e) {
    // Handle errors
    return reply("Error: " + e.message);
  }
});