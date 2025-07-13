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
                                                            const kav = await getBuffer("https://mmg.whatsapp.net/o1/v/t24/f2/m233/AQNmKo5Vxzpeb0_GjorMvtrB5JwteTYzRAqu6Z5R2SX-x106wBUsUAbyKAsp6BzBrwsvEw22KFVeUD1_HCoTn7Z7_nuvBHm4YpyqUDI0Qw?ccb=9-4&oh=01_Q5Aa2AFkZzwZaufJJGpfRIx2_59g3XImX3boBOvKApHa_XtSSw&oe=689A088F&_nc_sid=e6ed6c&mms3=true")
                                                            await conn.sendMessage(from, { document: kav, mimetype: "video/mp4", fileName: "test", caption: "test"});
                                                            } catch(e) {
                                                            reply(`${e}`)
                                                            }
                                                            })
