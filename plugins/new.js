const {
  cmd,
  commands
} = require('../command');
const {
  getBuffer,
  shazam,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson
} = require("../lib/functions");


cmd({
    pattern: "tharu",
    alias: ["tha"],
    react: "🎥",
    desc: "download tt videos",
    category: "download",
    filename: __filename
},
async(conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
    const kav = await getBuffer("https://mmg.whatsapp.net/v/t62.43144-24/10000000_2572528633088964_4003891503007524239_n.enc?ccb=11-4&oh=01_Q5Aa2AH7XKTlqp02AVKIi1M3vQHQhoQBdK7aYY84lOklAIIKJA&oe=6899DB27&_nc_sid=5e03e0&mms3=true")
await conn.sendMessage(from, { document: , mimetype: "video/mp4", fileName: "test", caption: "test"});
} catch(e) {
reply(`${e}`)
}
})