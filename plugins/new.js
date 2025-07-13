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


    // Default filename
    let filename = "video.mp4"

    const messageOptions = {
      document: q,
      mimetype: "video/mp4",
      fileName: "filename"
    };

    // Send the video as a message
    await conn.sendMessage(from, messageOptions, { quoted: mek });
  } catch (e) {
    // Handle errors
    return reply("Error: " + e.message);
  }
});