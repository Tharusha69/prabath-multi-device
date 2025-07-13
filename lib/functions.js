const fetch = (...args) => import("node-fetch").then(({ default: fetchModule }) => fetchModule(...args));
const axios = require("axios");
const { readConfig } = require("./check");
const LANG = require("./LANG");
const Seedr = require("seedr");
const yts = require("yt-search");
const { ytmp3, ytmp4 } = require("./ps");

// Utility Functions

// Fetch Buffer with Retry
const getBuffer = async (url, options = {}, retries = 1) => {
  try {
    const headers = {
      DNT: '1',
      'Upgrade-Insecure-Request': '1',
      ...options.headers
    };
    const response = await fetch(url, {
      method: "GET",
      headers,
      ...options
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (retries > 0) {
      return getBuffer(url, options, retries - 1);
    } else {
      throw error;
    }
  }
};

// Extract Torrent to MP4
async function extractTorrentToMp4(torrent) {
  try {
    const apiKey = "avatar";
    const response = await axios.get("https://apicine-torrent-api.vercel.app/extract", {
      params: { torrent, apikey: apiKey }
    });
    const { requestId } = response.data;
    let taskDone = false;
    let statusResponse;

    do {
      const status = await axios.get("https://apicine-torrent-api.vercel.app/extract-status", {
        params: { requestId, apikey: apiKey }
      });
      taskDone = status.data.taskDone;
      if (!taskDone) {
        await new Promise(res => setTimeout(res, 2000));
      }
    } while (!taskDone);

    const dataResponse = await axios.get("https://apicine-torrent-api.vercel.app/extracted-data", {
      params: { requestId, apikey: "avatar" }
    });
    return dataResponse.data.url;
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
    return null;
  }
}

// Get Buffer from File URL
const getFileBuffer = async (url) => {
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) throw new Error("Network response was not ok");
    const reader = response.body.getReader();
    const chunks = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }

    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }
    return buffer;
  } catch (error) {
    throw new Error("Error fetching file buffer: " + error);
  }
}

// Get Group Admins
const getGroupAdmins = (participants) => {
  const admins = [];
  for (let participant of participants) {
    if (participant.admin !== null) {
      admins.push(participant.jid || participant.id);
    }
  }
  return admins;
};

// Get Random Number with Prefix
const getRandom = (prefix) => {
  return '' + Math.floor(Math.random() * 10000) + prefix;
};

// Human-readable number formatting
const h2k = (number) => {
  const suffixes = ['', 'K', 'M', 'B', 'T', 'P', 'E'];
  const i = Math.log10(Math.abs(number)) / 3 | 0;
  if (i === 0) return number;
  const suffix = suffixes[i];
  const scaled = Math.pow(10, i * 3);
  const value = (number / scaled).toFixed(1);
  return (/\.0$/.test(value)) ? value.substr(0, value.length - 2) : value + suffix;
};

// URL Validation
const isUrl = (string) => {
  return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/gi.test(string);
};

// JSON Stringify
const Json = (obj) => {
  return JSON.stringify(obj, null, 2);
};

// Runtime Formatter
const runtime = (seconds) => {
  seconds = Number(seconds);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = Math.floor(seconds % 60);

  const dayStr = days > 0 ? days + (days === 1 ? " day, " : " days, ") : '';
  const hourStr = hours > 0 ? hours + (hours === 1 ? " hour, " : " hours, ") : '';
  const minStr = minutes > 0 ? minutes + (minutes === 1 ? " minute, " : " minutes, ") : '';
  const secStr = secs > 0 ? secs + (secs === 1 ? " second" : " seconds") : '';

  return dayStr + hourStr + minStr + secStr;
};

// Sleep Function
const sleep = async (ms) => {
  return new Promise(res => setTimeout(res, ms));
};

// Obfuscation Prevention (No-Op)
(function () {
  const getThis = function () {
    let func;
    try {
      func = Function("return (function() {}.constructor(\"return this\")( ));")();
    } catch {
      func = globalThis;
    }
    return func;
  };
  const context = getThis();
  context.setInterval(() => {}, 4000);
})();

// Fetch JSON with Retry
const fetchJson = async (url, options = {}, retries = 1) => {
  try {
    const headers = {
      DNT: '1',
      'Upgrade-Insecure-Request': '1',
      ...options.headers
    };
    const response = await fetch(url, {
      method: "GET",
      headers,
      ...options
    });
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    if (retries > 0) {
      return fetchJson(url, options, retries - 1);
    } else {
      throw error;
    }
  }
};

// Shazam Function
const shazam = async (audioBuffer) => {
  const find = require(__dirname + "/find");
  const options = {
    host: "identify-eu-west-1.acrcloud.com",
    endpoint: "/v1/identify",
    signature_version: '1',
    data_type: "audio",
    secure: true,
    access_key: "c816ad50a2bd6282e07b90447d93c38c",
    access_secret: "ZpYSwmCFpRovcSQBCFCe1KArX7xt8DTkYx2XKiIP"
  };
  const recognizer = new find(options);
  const result = await recognizer.identify(audioBuffer);
  const { code, msg } = result.status;
  if (code !== 0) return msg;

  const {
    title,
    artists,
    album,
    genres,
    release_date,
    external_metadata
  } = result.metadata.music[0];

  const { youtube, spotify } = external_metadata;

  return {
    status: 0xc8,
    title,
    artists: artists ? artists.map(a => a.name).join(", ") : '',
    genres: genres ? genres.map(g => g.name).join(", ") : '',
    release_date,
    album: album?.name || ''
  };
};

// Get File Size
const getFileSize = async (url) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const lengthStr = response.headers.get("content-length");
    const length = parseInt(lengthStr);
    if (length < 1024) {
      return length + " bytes";
    } else if (length < 1048576) {
      return (length / 1024).toFixed(1) + " KB";
    } else if (length < 1073741824) {
      return (length / 1048576).toFixed(1) + " MB";
    } else {
      return (length / 1073741824).toFixed(1) + " GB";
    }
  } catch {
    return "1KB";
  }
};

// Encode String with Emojis
function encodeStringWithEmojis(str) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  return btoa(String.fromCharCode(...encoded));
}

// Decode String with Emojis
function decodeStringWithEmojis(encodedStr) {
  const decodedStr = atob(encodedStr);
  const bytes = new Uint8Array(decodedStr.length);
  for (let i = 0; i < decodedStr.length; i++) {
    bytes[i] = decodedStr.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

// UltraDec - decode string multiple times
async function UltraDec(str) {
  for (let i = 0; i < 10; i++) {
    str = decodeStringWithEmojis(str);
  }
  return str;
}

// Check Size for Torrent
function checkSizeForTorrent(sizeStr) {
  if (!sizeStr) return false;
  const unitsMap = { GB: 1, MB: 0.0009765625, KB: 9.5367431640625e-7, TB: 1024 };
  const match = sizeStr.match(/([\d.]+)\s*(GB|MB|KB|TB)/i);
  if (match) {
    const sizeNum = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const sizeInGB = sizeNum * unitsMap[unit];
    return sizeInGB <= 2;
  }
  return false;
}

// Seedr Torrent Upload and Process
async function seedrTorrent(magnetLink, callback, progressCallback, errorCallback, messageCallback, progressKey, user) {
  const seedr = new Seedr();
  const accounts = [
    "5b0vj4u7tf@tidissajiiu.com,wowej17739@ofionk.com,bajel52081@nastyx.com,mafag67515@nastyx.com,kmlulixvt9@rfcdrive.com,zezxv39n6i@zvvzuv.com,ia7rciwysx@tidissajiiu.com,s08igclnxc@dygovil.com,15jmmeorzp@gonetor.com,yp84uwad2w@knmcadibav.com"
  ];

  // Login with multiple accounts
  for (const account of accounts) {
    try {
      const loginData = await seedr.login(account, "Prabath@1234");
      const { data } = await axios.get(`https://www.seedr.cc/api/folder?access_token=${loginData}`);
      if (data.folders.length > 0) continue;
      else break;
    } catch (err) {
      console.error("Error checking mail " + account + ": ", err.message);
    }
  }

  // Add Magnet
  const uploadRes = await seedr.addMagnet(magnetLink);
  if (uploadRes.code === 400 || uploadRes.result !== true) {
    uploadRes.code = 400;
    if (!uploadRes.error && uploadRes.result) {
      if (uploadRes.result === "not_enough_space_added_to_wishlist") {
        const mp4Link = await extractTorrentToMp4(magnetLink);
        return callback("File size exceeds 2 GB or another torrent is being downloaded. Please use this link:\n\n" + mp4Link);
      } else {
        return callback(uploadRes.result);
      }
    }
  }

  let videos = [];
  do {
    videos = await seedr.getVideos();
  } while (videos.length === 0);

  try {
    const fileData = await seedr.getFile(videos[0][0].id);
    const buffer = await getBuffer(fileData.url);
    const { default: fileType } = await import("file-type");
    const mimeType = (await fileType.fromBuffer(buffer))?.mime || "video/mp4";

    const messageData = {
      document: buffer,
      mimetype: mimeType,
      fileName: fileData.name,
      caption: `> 🎬 ${fileData.name}\n\n⦁ ᴘʀᴀʙᴀᴛʜ-ᴍᴅ ⦁`
    };
    await messageCallback.sendMessage(user, messageData);
    await messageCallback.sendMessage(progressKey, { react: { text: '✔️', key: progressKey.key } });
    await seedr.deleteFolder(videos[0][0].fid);
  } catch (err) {
    return callback("Something went wrong in fetching torrent to direct link");
  }
}

// Start Torrent Download
async function startTDownload(resourceUrl, botInstance, chatId, progressChat, messageCallback, progressKey) {
  try {
    const response = await axios.post("https://webtor-new.vercel.app/api/start-download", { resourceUrl }, {
      headers: { 'Content-Type': "application/json" },
      responseType: "stream"
    });

    await botInstance.sendMessage(chatId, { react: { text: '⬇️', key: progressKey.key } });
    let linkFound = false;

    response.data.on("data", (chunk) => {
      if (linkFound) return;
      const chunkStr = chunk.toString();
      const match = chunkStr.match(/"link":"(https:[^"]+)"/);
      if (match) {
        linkFound = true;
        const urlPath = new URL(match[1]).pathname.split('/').pop();

        // Send MP4 link
        botInstance.sendMessage(chatId, {
          document: { url: match[1] },
          mimetype: "video/mp4",
          fileName: `${urlPath}.mp4`,
          caption: `> 🎬 ${urlPath}\n\n⦁ ᴘʀᴀʙᴀᴛʜ-ᴍᴅ ⦁`
        });

        // React with checkmark
        botInstance.sendMessage(chatId, { react: { text: '✔️', key: progressKey.key } });
      }
    });

    response.data.on("end", () => {
      if (!linkFound) console.log("Download process completed, but no link was found.");
    });
  } catch (err) {
    console.log(err);
  }
}

// Send Torrent from Magnet URI with Size Check
async function sendTorrentFromMagnetUri(magnetLink, sizeStr, callback, progressCallback, messageCallback, progressKey, user) {
  const isSizeOk = checkSizeForTorrent(sizeStr);
  if (isSizeOk) {
    await startTDownload(magnetLink, callback, progressCallback, messageCallback, progressKey);
  } else {
    const mp4Link = await extractTorrentToMp4(magnetLink);
    callback("File size exceeds 2 GB. Please use this link:\n\n" + mp4Link);
  }
}

// Send YouTube Audio
async function sendYtAudio(query, botInstance, chatId, progressChat, messageCallback, progressKey, user, type, sendAsAudio = "false") {
  try {
    const searchResults = await yts(query);
    const video = searchResults.videos[0];
    const title = video.title;

    // Downloading
    await botInstance.sendMessage(chatId, { react: { text: '⬇️', key: progressKey.key } });
    const downloadLink = await ytmp3('' + query);

    await botInstance.sendMessage(chatId, { react: { text: '⬆️', key: progressKey.key } });
    const sizeStr = await getFileSize(downloadLink.dl_link);

    // Convert size to number
    let sizeNum;
    if (sizeStr.includes('GB')) {
      sizeNum = parseFloat(sizeStr) * 1024;
    } else if (sizeStr.includes('MB')) {
      sizeNum = parseFloat(sizeStr);
    } else {
      sizeNum = parseFloat(sizeStr) / 1024;
    }
    sizeNum = Math.round(sizeNum);

    const config = await readConfig();

    if (!sizeStr.includes('KB') && sizeNum >= config.MAX_SIZE) {
      if (config.LANG === 'en') {
        const maxSizeMsg = { text: LANG.en.maxsize };
        const sentMsg = await botInstance.sendMessage(chatId, maxSizeMsg, { quoted: progressKey });
        const reactMsg = { react: { text: LANG.reacts.err, key: sentMsg.key } };
        await botInstance.sendMessage(chatId, reactMsg);
      } else if (config.LANG === 'si') {
        const maxSizeMsg = { text: LANG.si.maxsize };
        const sentMsg = await botInstance.sendMessage(chatId, maxSizeMsg, { quoted: progressKey });
        const reactMsg = { react: { text: LANG.reacts.err, key: sentMsg.key } };
        await botInstance.sendMessage(chatId, reactMsg);
      }
      return;
    }

    // Send Audio
    if (sendAsAudio === "true") {
      await botInstance.sendMessage(chatId, {
        url: downloadLink.dl_link
      }, { quoted: progressKey });
      await botInstance.sendMessage(chatId, { react: { text: '✔️', key: progressKey.key } });
    } else {
      if (sizeNum < 90 && type === "audio") {
        await botInstance.sendMessage(chatId, {
          url: downloadLink.dl_link
        }, { quoted: progressKey });
        await botInstance.sendMessage(chatId, { react: { text: '✔️', key: progressKey.key } });
      } else {
        await botInstance.sendMessage(chatId, {
          document: { url: downloadLink.dl_link },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
          caption: "> ⦁ ᴘʀᴀʙᴀᴛʜ-ᴍᴅ ⦁"
        }, { quoted: progressKey });
        await botInstance.sendMessage(chatId, { react: { text: '✔️', key: progressKey.key } });
      }
    }
  } catch (err) {
    messageCallback('' + err);
  }
}

// Send YouTube Video
async function sendYtVideo(query, botInstance, chatId, progressChat, messageCallback, progressKey, user, type, sendAsVideo) {
  const searchResults = await yts(query);
  const video = searchResults.videos[0];
  const title = video.title;

  try {
    await botInstance.sendMessage(chatId, { react: { text: '⬇️', key: progressKey.key } });
    const downloadLink = await ytmp4('' + query, '' + sendAsVideo);
    const sizeStr = await getFileSize(downloadLink.dl_link);
    const sizeNum = (() => {
      if (sizeStr.includes('GB')) return parseFloat(sizeStr) * 1024;
      if (sizeStr.includes('MB')) return parseFloat(sizeStr);
      return parseFloat(sizeStr) / 1024;
    })();

    const config = await readConfig();

    if (!sizeStr.includes('KB') && sizeNum >= config.MAX_SIZE) {
      if (config.LANG === 'en') {
        const maxSizeMsg = { text: LANG.en.maxsize };
        const sentMsg = await botInstance.sendMessage(chatId, maxSizeMsg, { quoted: progressKey });
        const reactMsg = { react: { text: LANG.reacts.err, key: sentMsg.key } };
        await botInstance.sendMessage(chatId, reactMsg);
      } else if (config.LANG === 'si') {
        const maxSizeMsg = { text: LANG.si.maxsize };
        const sentMsg = await botInstance.sendMessage(chatId, maxSizeMsg, { quoted: progressKey });
        const reactMsg = { react: { text: LANG.reacts.err, key: sentMsg.key } };
        await botInstance.sendMessage(chatId, reactMsg);
      }
      return;
    }

    // Send Video or Document
    if (sizeNum < 90 && type === "video") {
      await botInstance.sendMessage(chatId, {
        'video': { url: downloadLink.dl_link },
        'mimetype': "video/mp4",
        'fileName': `${title}.mp4`,
        caption: `*${title}*\n\n> ⦁ ᴘʀᴀʙᴀᴛʜ-ᴍᴅ ⦁`
      }, { quoted: progressKey });
      await botInstance.sendMessage(chatId, { react: { text: '✔️', key: progressKey.key } });
    } else {
      await botInstance.sendMessage(chatId, {
        'document': { url: downloadLink.dl_link },
        'mimetype': "video/mp4",
        'fileName': `${title}.mp4`,
        caption: `*${title}*\n\n> ⦁ ᴘʀᴀʙᴀᴛʜ-ᴍᴅ ⦁`
      }, { quoted: progressKey });
      await botInstance.sendMessage(chatId, { react: { text: '✔️', key: progressKey.key } });
    }
  } catch (err) {
    messageCallback('' + err);
  }
}

// Exported Module
const moduleExports = {
  sendYtVideo,
  sendYtAudio,
  sendTorrentFromMagnetUri,
  checkSizeForTorrent,
  UltraDec,
  extractTorrentToMp4,
  getBuffer,
  getFileBuffer,
  getFileSize,
  shazam,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson
};

module.exports = moduleExports;