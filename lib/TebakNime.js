const fs = require('fs');
const db = require('./databases.js');

const tebak_nime_ans = new Map();
const tebak_nime_timers = new Map();
const tebak_nime_items = new Map(); // Menyimpan informasi sesi yang masih ada

function tresholdmentah(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (const [i] of matrix.entries()) {
        matrix[i][0] = i;
    }
    for (const [j] of matrix[0].entries()) {
        matrix[0][j] = j;
    }

    for (const [i] of matrix.entries()) {
        if (i === 0) continue;
        for (const [j] of matrix[0].entries()) {
            if (j === 0) continue;
            if (a[i - 1] === b[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[a.length][b.length];
}

async function TebakNime(perintah, text, m, Sekai, jmlhsmntr) {
    function balas(pesannya) {
        try {
            Sekai.sendMessage(m.chat, { text: pesannya }, { quoted: m, ephemeralExpiration: jmlhsmntr });
        } catch (error) {
            console.error("Error saat mengirim pesan:", error);
            throw error;
        }
    }

    const penggunanya = db.getUser(m.sender);

    if (perintah === "tebak") {
        if (!penggunanya.sesiTebakAnime) return balas("Sesi Tebaknime Mu Belum Di Buat, Mulai Game Dengan Mengetik !tebaknime");
        if (!tebak_nime_ans.has(m.sender)) return balas("Belum ada jawaban sama sekali di database dinamik");

        const jawabanBenar = tebak_nime_ans.get(m.sender).toLowerCase();
        const jawabanUser = text.toLowerCase();

        const distance = tresholdmentah(jawabanBenar, jawabanUser);
        const threshold = Math.floor(jawabanBenar.length / 3);

        if (distance <= threshold) {
            balas("This Answer Correct. +1000 Exp For You.");
            penggunanya.exp += 1000;
            db.updateUser(m.sender, penggunanya);
            tebak_nime_ans.delete(m.sender);
            penggunanya.sesiTebakAnime = false;

            clearTimeout(tebak_nime_timers.get(m.sender));
            tebak_nime_timers.delete(m.sender);
        } else {
            balas("Bukan Itu Jawabannyaaa, Astaga Kamu bikin ga mood aja, coba lagi sana");
        }
    }

    if (perintah === "tebaknime") {
        if (penggunanya.sesiTebakAnime) {
            const currentSession = tebak_nime_items.get(m.sender);
            if (currentSession) {
                let retryCount = 0;
                const maxRetries = 3;

                while (retryCount < maxRetries) {
                    try {
                        await Sekai.sendMessage(m.chat, {
                            image: { url: currentSession.fotonya },
                            caption: `*[ Tebak Nime ( Sesi Sebelumnya ) ]*\n\nTebak Dari Manakah Gambar Anime Ini Berasal?\nJudul: ${currentSession.judul}\nTimeout: 1 Menit 30 Detik\n\nKetik !tebak <jawaban kamu> untuk menjawab`,
                        }, { quoted: m, ephemeralExpiration: jmlhsmntr });
                        console.log(`[ LOGGED PREVIOUS SESSION TEBAKNIME ]`);
                        break;
                    } catch (error) {
                        retryCount++;
                        console.error(`Error saat mengirim gambar (Percobaan ${retryCount}):`, error);
                        if (retryCount >= maxRetries) throw error; // Lempar error jika retry melebihi batas
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Tunggu 1 detik sebelum retry
                    }
                }
                return;
            }
        }

        if (tebak_nime_ans.has(m.sender)) {
            tebak_nime_ans.delete(m.sender);
            clearTimeout(tebak_nime_timers.get(m.sender));
            tebak_nime_timers.delete(m.sender);
        }

        const tebaranai = './databases/TebakAnime.json';
        const tebaparasai = fs.readFileSync(tebaranai, 'utf8');
        let desewaranai = JSON.parse(tebaparasai);

        function randomaranai(randomfunc) {
            return randomfunc.split('').map(char => (char !== ' ' && Math.random() > 0.5 ? '*' : char)).join('');
        }

        const randomItem = desewaranai[Math.floor(Math.random() * desewaranai.length)];
        tebak_nime_ans.set(m.sender, randomItem.jawabannya);
        tebak_nime_items.set(m.sender, { fotonya: randomItem.fotonya, judul: randomaranai(randomItem.jawabannya) });

        const textTebakAnime = `*[ Tebak Anime ]*\n\nTebak Dari Manakah Gambar Anime Ini Berasal?\nJudul: ${tebak_nime_items.get(m.sender).judul}\nTimeout: 1 Menit 30 Detik\n\nKetik !tebak <jawaban kamu> untuk menjawab`;

        penggunanya.sesiTebakAnime = true;

        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                await Sekai.sendMessage(m.chat, {
                    image: { url: randomItem.fotonya },
                    caption: textTebakAnime,
                }, { quoted: m, ephemeralExpiration: jmlhsmntr });
                
                const timer = setTimeout(() => {
                    if (tebak_nime_ans.has(m.sender)) {
                        tebak_nime_ans.delete(m.sender);
                        penggunanya.sesiTebakAnime = false;
                        tebak_nime_items.delete(m.sender);
                        balas("Time is up! The session has ended without a correct answer.\n\nType !tebaknime again to start a session");
                    }
                }, 90000); // 1 Menit 30 Detik

                tebak_nime_timers.set(m.sender, timer);

                break;
            } catch (error) {
                retryCount++;
                console.error(`Error saat mengirim gambar (Percobaan ${retryCount}):`, error);
                if (retryCount >= maxRetries) throw error; 
                await new Promise(resolve => setTimeout(resolve, 1000)); 
            }
        }
    }
}

module.exports = { TebakNime };