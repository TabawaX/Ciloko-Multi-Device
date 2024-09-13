const fetch = require("node-fetch");
const apikey = "YOUR_API_KEY";

/*
 * Fungsi untuk menjalankan perintah AI sesuai dengan tipe yang dipilih
 * @param => typeai: Tipe AI yang akan digunakan
 * @param => text: Teks yang akan diproses oleh AI
 * @param => urlimg: URL gambar jika ada (jika diperlukan oleh AI)
 * @param => m: Objek pesan
 * @param => Sekai: Objek Sekai untuk pengiriman pesan
 * @param => jmlhsmntr: Durasi sementara pesan ephemeral
 */
async function aifunc(typeai, text, urlimg, m, Sekai, jmlhsmntr) {

    /*
     * Fungsi untuk mengirim pesan balasan
     * @param => pesannya: Pesan yang akan dikirim sebagai balasan
     */
    function balas(pesannya) {
        try {
            Sekai.sendMessage(m.chat, { text: `${pesannya}` }, { quoted: m, ephemeralExpiration: jmlhsmntr });
        } catch (error) {
            console.error("Error saat mengirim pesan:", error);
            throw error;
        }
    }

    let api_url = '';
    let response;
    let data;
    let ai_name = ''; // Variabel untuk menyimpan nama AI

    switch(typeai) {
        case 'meta-Llama':
            api_url = `https://api.neoxr.eu/api/llama?q=${encodeURIComponent(text)}&apikey=${apikey}`;
            ai_name = 'meta-Llama';
            break;
        case 'palm-ai':
            api_url = `https://api.neoxr.eu/api/palm?q=${encodeURIComponent(text)}&apikey=${apikey}`;
            ai_name = 'palm-ai';
            break;
        case 'mixtral':
            api_url = `https://api.neoxr.eu/api/mixtral?q=${encodeURIComponent(text)}&apikey=${apikey}`;
            ai_name = 'mixtral';
            break;
        case 'koros-ai':
            api_url = `https://api.neoxr.eu/api/koros?image=${encodeURIComponent(urlimg)}&q=${encodeURIComponent(text)}&apikey=${apikey}`;
            ai_name = 'koros-ai';
            break;
        case 'gemini-vision':
            api_url = `https://api.neoxr.eu/api/gemini-vision?image=${encodeURIComponent(urlimg)}&lang=id&apikey=${apikey}`;
            ai_name = 'gemini-vision';
            break;
        case 'gemini-chat':
            api_url = `https://api.neoxr.eu/run/R29vZ2xlIEdlbWluaSBDaGF0?q=${encodeURIComponent(text)}&apikey=${apikey}`;
            ai_name = 'gemini-chat';
            break;
        case 'claude-3':
            api_url = `https://api.neoxr.eu/api/claude3?q=${encodeURIComponent(text)}&apikey=${apikey}`;
            ai_name = 'claude-3';
            break;
        case 'bard':
            api_url = `https://api.neoxr.eu/api/bard?q=${encodeURIComponent(text)}&apikey=${apikey}`;
            ai_name = 'bard';
            break;
        case 'gpt4':
            api_url = `https://api.neoxr.eu/api/gpt4-mini?q=${encodeURIComponent(text)}&apikey=${apikey}`;
            ai_name = 'gpt4';
            break;
        default:
            return balas("apasih sensei ai itu g ada.");
    }

    try {
        response = await fetch(api_url);
        data = await response.json();

        if (typeai === 'koros-ai') {
            if (data && data.status && data.data) {
                const { question, description } = data.data;
                return balas(`${ai_name}: *Pertanyaan*: ${question}\n*Penjelasan*: ${description}`);
            } else {
                return balas(`${ai_name}: Gambarmu Absurd Anjayy.`);
            }
        } else if (typeai === 'gemini-vision') {
            if (data && data.data) {
                const { description } = data.data;
                return balas(`${ai_name}: *Penjelasan*: ${description}`);
            } else {
                return balas(`${ai_name}: Gambarmu Absurd Anjayy.`);
            }
        } else if (data && data.status && data.data && data.data.message) {
            return balas(`${ai_name}: ${data.data.message}`);
        } else {
            return balas(`${ai_name}: lg g mood cri yg lain aj.`);
        }
    } catch (error) {
        console.error("Error saat memanggil API AI:", error);
        return balas(`${ai_name}: mls g mood.`);
    }

}
module.exports = { aifunc };