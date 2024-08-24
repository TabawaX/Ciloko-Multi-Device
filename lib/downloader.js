/*
Minimal? Lu Kan Buat Sc juga ,ini gw buat dari 0
Lu Tau kan susahnya buat sc? minimal Hargain Gw
Credit Gw Kalo lu pake / recode
jujur gw buat nih sistem setengah mati anjing 
Gw Doain lu yg ambil terus jual , neraka jahanam allah saksinyan

Minimal Credit Bos
Github: TabawaX
Pembuat: Tabawa Renkie
Nomer Whatsapp: 0838-3428-1572
*/



// downloader.js
const { randomUUID } = require('crypto')
const fetch = require("node-fetch")
const fs = require("fs")
const fsPromises = require('fs/promises')
const axios = require('axios')
const ytSearch = require("yt-search")
const { checkPremiumUser } = require('./premium.js')
const Tiktok = require('./tiktokdl.js') 

const apikey = "YOUR_API_KEY" 

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function instastory(usrnmig, m, Sekai, jmlhsmntr) { 
  function balas(pesannya) {
    try {
      Sekai.sendMessage(m.chat, { text: pesannya }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    } catch (error) {
      console.error("Error saat mengirim pesan:", error)
      throw error
    }
  }

  balas("Processing...")

  try {
    const resstory = await fetch(`https://api.neoxr.eu/api/igs?username=${usrnmig}&apikey=${apikey}`)
    const storyJSON = await resstory.json()

    if (storyJSON.status) {
      for (const story of storyJSON.data) {
        if (story.type === "mp4") {
          await Sekai.sendMessage(m.chat, { 
            video: { url: story.url }, 
            caption: "Success Mp4 Type" 
          }, { quoted: m, ephemeralExpiration: jmlhsmntr })
        } else if (story.type === "jpg" || story.type === "png") {
          await Sekai.sendMessage(m.chat, {
            image: { url: story.url },
            caption: "Success JPG/PNG Type"
          }, { quoted: m, ephemeralExpiration: jmlhsmntr })
        }
        await sleep(5000)
      }
    } else {
      balas("404 No JPG/PNG/MP4 Type.")
    }
  } catch (error) {
    console.error(error)
    balas("Terjadi kesalahan saat mengunduh story.")
  }
}

async function spotifydl(spodl, m, Sekai, jmlhsmntr) { 
  try {
    const response = await fetch(`https://api.neoxr.eu/api/spotify?url=${spodl}&apikey=${apikey}`)
    
    if (!response.ok) {
      throw new Error(response.status === 404 ? "Song not found, but API is stable. Alternative using https://spotifydown.com/" : "Unknown error, alternative using https://spotifydown.com/")
    }

    const sptfyJson = await response.json()

    if (!sptfyJson.status) {
      throw new Error("Failed to retrieve song data. Alternative using https://spotifydown.com/")
    }

    const textCaptionsptfy = `Lagu Sudah Di Temukan!\n\n- Judul: ${sptfyJson.data.title}\n- Artis: ${sptfyJson.data.artist.name}\n- Durasi: ${sptfyJson.data.duration}\n\n\nEN: Audio will be sent in >= 10 seconds....\nID: Audio Akan Dikirim Dalam >= 10 Detik....`

    await Sekai.sendMessage(m.chat, {
      image: {
        url: sptfyJson.data.thumbnail
      },
      caption: textCaptionsptfy
    }, { quoted: m, ephemeralExpiration: jmlhsmntr })

    await Sekai.sendMessage(m.chat, {
      audio: { url: sptfyJson.data.url },
      mimetype: 'audio/mp4',
      ptt: false
    }, { quoted: m, ephemeralExpiration: jmlhsmntr })

  } catch (error) {
    console.error("Error fetching Spotify data:", error.message)
    throw new Error ("Some Code Syntax Error Please Contact Developer To Fix It, Or Use Alternative  https://spotifydown.com")
  }
}


async function twtdl(twt, m, Sekai, jmlhsmntr) {
  try {
    const response = await fetch(`https://api.neoxr.eu/api/twitter?url=${twt}&apikey=${apikey}`)
    if (!response.ok) {
      throw new Error(response.status ? "Unknown error, alternative using https://redketchup.io/twitter-downloader" : "Video not found, but API is stable. Alternative using https://redketchup.io/twitter-downloader")
    }

    const twtJson = await response.json()
    const twtData = Array.isArray(twtJson.data[0]) ? twtJson.data[0][0] : twtJson.data[0]
    const twtType = twtData.type

    if (twtType === "mp4") {
      Sekai.sendMessage(m.chat, { video: { url: twtData.url }, caption: null }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    } else if (twtType === "jpg") {
      Sekai.sendMessage(m.chat, { image: { url: twtData.url }, caption: null }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    } else {
      m.reply('Video/photo not found. Alternative using: https://redketchup.io/twitter-downloader')
    }
  } catch (error) {
    console.error('Error fetching Twitter API:', error)
    throw new Error('Failed to fetch Twitter info. Alternative using https://redketchup.io/twitter-downloader')
  }
}

async function ytPlay(query, m, Sekai, jmlhsmntr) { 
    try {
        const { videos } = await ytSearch(query)

        if (!videos || videos.length === 0) throw new Error("No videos found for the given query.")

        const video = videos[0]
        await Sekai.sendMessage(m.chat, { 
            text: `
Title: ${video.title}
Duration: ${video.timestamp}
Link: ${video.url}

You Can Download *Link* Via *!dl* or *!dlmp3*
`,
            image: video.image,
        }, { quoted: m, ephemeralExpiration: jmlhsmntr })

    } catch (error) {
        console.log(error)
        throw new Error(`Error: ${error.message}`)
    }
}
async function getTikMp3(tikmp3, m, Sekai, jmlhsmntr) {
  try {
    const response = await fetch(`https://api.neoxr.eu/api/tiktok?url=${tikmp3}&apikey=${apikey}`)
    
    if (!response.ok) {
      throw new Error(response.status ? "Unknown error" : "Video not found, but API is stable")
    }

    const tikJson = await response.json()

    Sekai.sendMessage(m.chat, {
      audio: { url: tikJson.data.audio },
      mimetype: 'audio/mp4',
      ptt: false,
    }, { ephemeralExpiration: jmlhsmntr })
  } catch (error) {
    console.error('Error Fetching TikTok API:', error)
    throw new Error('Failed to fetch TikTok info.')
  }
}

async function getfesbuk(fesbukurl, m, Sekai, jmlhsmntr) {
function balas(pesannya) {
  try {
    Sekai.sendMessage(m.chat, { text: pesannya }, { quoted: m, ephemeralExpiration: jmlhsmntr })
  } catch (error) {
    console.error("Error saat mengirim pesan:", error)
    throw error
  }
}
  try {
    const response = await fetch(`https://api.neoxr.eu/api/fb?url=${encodeURIComponent(fesbukurl)}&apikey=${apikey}`) 
    if (!response.ok) { 
      balas("Bad Request")
      return
    }
    const datanya = await response.json()

    if (!datanya.status) {
      balas("Photo Downloader for Facebook is not available now")
      return
    }

    const hdVideo = datanya.data.find(video => video.quality === "HD")
    const sdVideo = datanya.data.find(video => video.quality === "SD" && video.url)

    if (hdVideo && hdVideo.url !== null) {
      await Sekai.sendMessage(m.chat, {
        video: {
          url: hdVideo.url
        }
      }, {
        quoted: m,
        ephemeralExpiration: jmlhsmntr
      })
    } else if (sdVideo) {
      await Sekai.sendMessage(m.chat, {
        video: {
          url: sdVideo.url
        }
      }, {
        quoted: m,
        ephemeralExpiration: jmlhsmntr
      })
    } else {
      balas("HD and SD videos are not available")
    }

  } catch (error) {
    console.error('Error Fetching Facebook API:', error)
    throw new Error('Failed to fetch Facebook info.')
  }
}


async function getytmp3(youtubeUrl, m, Sekai, jmlhsmntr) {
function balas(pesannya) {
    try {
      Sekai.sendMessage(m.chat, { text: pesannya }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    } catch (error) {
      console.error("Error saat mengirim pesan:", error)
      throw error
    }
  }
try {
    const response = await fetch(`https://api.neoxr.eu/api/youtube?url=${youtubeUrl}&type=audio&quality=128kbps&apikey=${apikey}`)
    const data = await response.json()
    
    if (data.status) {
      /*const fileSize = parseFloat(data.data.size.replace(' MB', ''))
      if (fileSize > 30) {
        balas('File size exceeds 30 MB')
        return
      }*/
      
      const videoUrl = data.data.url
      
      Sekai.sendMessage(m.chat, { audio: { url: videoUrl }, ptt: false, mimetype: 'audio/mp4' }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    } else {
      balas('Failed to fetch audio details')
    }
  } catch (error) {
    console.error('Error fetching video:', error)
    balas("Ciloko Lagi Males")
  }
}

/*
 * @param => async: Async Commands
 * @param => commands: Execute IsCommands With Commands
 * @param => checkUserCooldown @command @condition
 */

async function getytmp4(youtubeUrl, m, Sekai, jmlhsmntr) {
  function balas(pesannya) {
    try {
      Sekai.sendMessage(m.chat, { text: pesannya }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    } catch (error) {
      console.error("Error saat mengirim pesan:", error)
      throw error
    }
  }

  try {
    // Membaca informasi premium dari file JSON
    const data = await fsPromises.readFile('./databases/prem.json', 'utf8')
    const premiumInfo = JSON.parse(data)
    const isPremium = checkPremiumUser(m.sender, premiumInfo)

    const qualities = ['480p', '360p', '240p']
    let videoData = null

    for (let quality of qualities) {
      const response = await fetch(`https://api.neoxr.eu/api/youtube?url=${youtubeUrl}&type=video&quality=${quality}&apikey=${apikey}`)
      videoData = await response.json()
      
      if (videoData.status) {
        break
      }
    }


if (videoData && videoData.status) {
  // Mengonversi durasi dari format "HH:MM:SS" atau "MM:SS" ke detik
  const parts = videoData.duration.split(':')
  let durasi = 0
  let multiplier = 1

  while (parts.length > 0) {
    durasi += multiplier * parseInt(parts.pop(), 10)
    multiplier *= 60
  }
  
      if (!isPremium && durasi > 15 * 60) { // 15 menit = 900 detik
        balas(`Senseiii Kamu Melebihi Batas Durasi 15 Menit!\n\n\nNote: Upgrade Ke *!premium* untuk Menambah batas durasi 60 menit`)
        return
      } else if (isPremium && durasi > 60 * 60) { // 60 menit = 3600 detik
        balas(`Heiii Sensei Premium Kamu Lebihin batas!! 60 menit cari vidio lain atau download di browser aja`)
        return
      }

      const videoUrl = videoData.data.url
      const caption = `
Title: ${videoData.title}
Channel: ${videoData.channel}
Duration: ${videoData.duration}
Views: ${videoData.views}
Published: ${videoData.publish}
Quality: ${videoData.data.quality}
Size: ${videoData.data.size}
      `

      await Sekai.sendMessage(m.chat, { 
        video: { url: videoUrl }, 
        caption: caption 
      }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    } else {
      throw new Error('Gagal menemukan kualitas video yang diinginkan hingga 240p.')
    }
  } catch (error) {
    console.error('Error fetching video:', error)
    balas("Ciloko Lagi Males")
  }
}


async function getIgMediaUrl(igurl, m, Sekai, jmlhsmntr) {
  try {
    const response = await fetch(`https://api.neoxr.eu/api/ig?url=${igurl}&apikey=${apikey}`)
    const data = await response.json()

    if (!data || !data.data || data.data.length === 0) {
      throw new Error("Gagal mengambil URL media Instagram: Data tidak lengkap atau tidak tersedia.")
    }

    for (let i = 0; i < data.data.length; i++) {
      const media = data.data[i]
      const mediaType = media.type.toLowerCase()
      const mediaUrl = media.url

      if (mediaType === 'mp4') {
        Sekai.sendMessage(m.chat, {
          video: {
            url: mediaUrl
          },
          caption: null
        }, {
          quoted: m, 
          ephemeralExpiration: jmlhsmntr
        })
      } else if (mediaType === 'jpg' || mediaType === 'jpeg' || mediaType === 'png') {
        Sekai.sendMessage(m.chat, {
          image: {
            url: mediaUrl
          },
          caption: null
        }, { ephemeralExpiration: jmlhsmntr })
        await sleep(9000)
      } else {
        console.log(`Unsupported media type: ${mediaType}`)
      }
    }

    if (!data.status) {
      throw new Error(data.message || "Gagal mengambil URL media Instagram")
    }
  } catch (error) {
    throw new Error(`Gagal mengambil URL media Instagram: ${error}`)
  }
}

async function getTiktokMediaUrl(tiktokurl, m, Sekai, jmlhsmntr) {
  try {
    const tiktokInstance = new Tiktok()
    const data = await tiktokInstance.tikdown(tiktokurl)

    if (data && data.data && data.data.length > 0) {
      for (let i = 0 i < data.data.length i++) {
        const item = data.data[i]
        if (item.type === 'slide') {
          await Sekai.sendMessage(m.chat, {
            image: {
              url: item.link
            },
            caption: null
          }, { ephemeralExpiration: jmlhsmntr })
          await sleep(10000) // Jeda 
        } else if (item.type === 'no-watermark') {
          await Sekai.sendMessage(m.chat, {
            video: {
              url: item.link
            },
            caption: null
          }, {
            quoted: m,
            ephemeralExpiration: jmlhsmntr
          })
        }
      }
    } else {
      throw new Error("Lg g mood")
    }
  } catch (error) {
    throw new Error(`g mood`)
  }
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}



module.exports = {
  sleep, 
  instastory,
  spotifydl,
  twtdl,
  ytPlay,
  getTikMp3,
  getytmp3,
  getfesbuk,
  getytmp4,
  getIgMediaUrl,
  getTiktokMediaUrl
}