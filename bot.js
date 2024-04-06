const { default: makeWaSocket, useMultiFileAuthState, downloadMediaMessage } = require("@whiskeysockets/baileys");
const { log } = require("console");
const pino = require("pino");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { err } = require("pino-std-serializers");


async function connectToWhatsapp(){
    const auth = await useMultiFileAuthState("sesion");
    const socket = makeWaSocket({
        printQRInTerminal : true,
        browser : ["sibay", "Firefox","1.0.0"],
        auth : auth.state, 
        logger : pino({ level : "silent"}),
        generateHighQualityLinkPreview : true
    });
    socket.ev.on("creds.update", auth.saveCreds);
    socket.ev.on("connection.update", ({ connection }) => {
        if(connection === "open")  console.log(`Udah connet di hp ${socket.user.id.split(":")[0]}`)
        if(connection === "close") connectToWhatsapp()
    });

    // Membuat pesan
    socket.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];

        function reply(text) {
            socket.sendMessage(msg.key.remoteJid, {text: text}, {quoted : msg});
        }
     
        const msgType = Object.keys(msg.message)[0];
        const msgText = msgType === "conversation" 
            ? msg.message.conversation 
            : msgType === "extendedTextMessage" 
            ? msg.message.extendedTextMessage.text 
            : msgType === "imageMessage" 
            ? msg.message.imageMessage.caption : "";

        
        if ( !msgText.startsWith(".")) return;
        console.log(`Tipe message ; ${msgType}\ntipe text pesannya : ${msgText}`)
        const command = msgText.replace(/^\./g, "")
        const id = msg.key.remoteJid;
        console.log(`Command : ${command}`)
        switch(command.toLowerCase()) {
            case "sticker" : case "stiker" : case "s" :
                const buffer = await downloadMediaMessage(
                    msg,"buffer",{},{logger : pino}
                )
                fs.writeFileSync("./temp/sticker.png", buffer)
                ffmpeg("./temp/sticker.png")
                .format("webp")
                .on("error", (err) => console.log(`Error: ${err.message}`))
                .on("end", () => console.log("Konversi selesai"))
                .save("./temp/sticker.webp");
            
                break;
            case "ping" :
                reply("!pong")
                break;
            case "link" :
                reply("https://id.pinterest.com/pin/54184001761041599/")
                break;
            
        }

    } )
}

connectToWhatsapp()
