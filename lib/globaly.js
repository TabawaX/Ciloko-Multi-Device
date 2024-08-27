const fs = require('fs').promises
const db = require('./databases.js')
let premium = []

const {
  addPremiumUser,
  getPremiumExpired,
  getPremiumPosition,
  checkPremiumUser,
  getAllPremiumUser,
} = require('./premium.js')

const categories = {
  ai: {
    emoji: '🍃',
    commands: [   
      '.asitype <type>',
      '.asi < ask anything >'
    ]
  },
  utils: {
    emoji: '💐',
    commands: [ 
      '.snobg',
      '.gift',
      '.redeem',
      '.leaderboard',
      '.shop',
      '.listkodam',
      '.tomp3',
      '.lastgempa',
      '.jadwalbola',
      '.instastory < username >',
      '.gkodam',
      '.lirik < lagu >',
      '.togif < gambar >',
      '.glens < gambar >',
      '.wm < text 1 - text 2 >',
      '.toimg < reply photo >',
      '.claim',
      '.play < judul youtube >',
      '.smeme < gambar >',
      '.dlmp3 < link >',
      '.dl < link >',
      '.sticker < gambar >',
      '.pickside',
      '.my',
      '.download'
    ]
  },
  imageProcessing: {
    emoji: '🖼️',
    commands: [
      '.pixelimg < text to image >',
      '.pin < search pinterest >',
      '.removebg < reply/send media >',
      '.hd < reply/send media >',
      '.wibu4x < reply/send media >'
    ]
  },
  group: {
    emoji: '🏵️',
    commands: [   
      '.kick < tag/reply >',
      '.antispam <on/off>',
      '.badword <on/off>',
      '.mute <on/off>',
      '.warn <tag/reply>',
      '.delwarn <tag/reply>',
      '.hidetag',
      '.antilink < on / off >'
    ]
  },
  gamesBot: {
    emoji: '🌻',
    commands: [
      '.fkodam',
      '.clan',
      '.tebaknime'
    ]
  }
}

async function mainmenunya(Sekai, m, sender, jmlhsmntr) { 
  const user = db.getUser(sender) 
  const data = await fs.readFile('./databases/prem.json', 'utf8')
  const premiumInfo = JSON.parse(data)
  const isPremium = checkPremiumUser(sender, premiumInfo)

  let premiumStatus = isPremium ? "Membership" : "Reguler"
  let limitText = isPremium ? "Unlimited" : user.limit

  
  let sekaimenu = `*╓───〘  INFO PENGGUNA  〙*
*║* Nama: ${user.nick}
*║* Limit: ${limitText}
*║* Premium: ${premiumStatus}
*╙────────────ふ*\n`

  

  for (const [category, { emoji, commands }] of Object.entries(categories)) {
    const categoryName = capitalizeFirstLetter(category.replace(/([A-Z])/g, ' $1'))
    sekaimenu += `\n${emoji} *${categoryName}* (${commands.length})\n`
    commands.forEach(command => {
      sekaimenu += `➠ ${command}\n`
    })
  }

  Sekai.sendMessage(m.chat, {
    text: sekaimenu,
    contextInfo: { 
      mentionedJid: [m.sender],
      externalAdReply: { 
        title: '🅒 🅘 🅛 🅞 🅚 🅞',
        body: '☃ Menu Esensial',
        thumbnailUrl: "https://telegra.ph/file/6ac848e17dea182eacaa6.jpg",
        sourceUrl: 'https://kislana.my.id',
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m, ephemeralExpiration: jmlhsmntr })
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
  
const premiumMap = new Map()

async function loadPremiumInfo() {
  try {
    const data = await fs.readFile('./databases/prem.json', 'utf8')
    const premiumInfo = JSON.parse(data)
    premium = premiumInfo
    premiumInfo.forEach(prem => premiumMap.set(prem.id, prem))
  } catch (err) {
    console.error('Error reading or parsing prem.json:', err)
  }
}

async function infomain(Sekai, m, sender, jmlhsmntr) {
    try {
        await loadPremiumInfo() 
        const user = db.getUser(sender)
        const groupID = m.chat
        const group_official = '120363199432855089@g.us'

        if (!user) {
            console.error("User not found in the database:", sender)
            return
        }

      
        const dewaranai = JSON.parse(await fs.readFile('./databases/sewa.json', 'utf8'))
        const keranaii = JSON.parse(await fs.readFile('./databases/guild.json', 'utf8'))
        const data = JSON.parse(await fs.readFile('./src/database.json', 'utf8'))
        const users = data.users

        
        const userArray = Object.keys(users).map(key => ({
            username: users[key].nick,
            exp: users[key].exp,
            nextlevel: users[key].nextlevelnya,
            level: users[key].level || 0
        }))

        
        userArray.sort((a, b) => b.level - a.level || b.exp - a.exp)

        const userIndex = userArray.findIndex(u => u.username === user.nick)
        const userRank = userIndex + 1 

        const userPremium = premiumMap.get(sender)

        const displayLimit = userPremium ? 'unlimited' : user.limit
        const displayYesNo = userPremium ? 'yes' : 'no'
        const username = user.nick || 'Unknown'
        const level = user.level || 0
        const nextLevel = user.nextlevelnya || 'Unknown'
        const exp = user.exp || 0

        const remainingDays = userPremium 
            ? Math.ceil((userPremium.expired - Date.now()) / (1000 * 60 * 60 * 24)) 
            : 'until death'

        let userInfo = `*〘 USER INFO 〙*\n`
        userInfo += `*➠ Name:* ${username}\n`
        userInfo += `*➠ Limit:* ${displayLimit}\n`
        userInfo += `*➠ Level:* ${level} (${exp}/${nextLevel})\n` 
        userInfo += `*➠ Global Rank:* ${userRank}\n`
        userInfo += `*➠ R.crystal:* ${user.Rcrystal}\n`
        userInfo += `*➠ Premium Status:* ${displayYesNo}\n`
        userInfo += `*➠ Expires in:* ${remainingDays} days\n\n`

        let factionInfo = `*〘 USER CARD 〙*\n`
        factionInfo += `*➠ Faction:* ${user.fraksi || 'Unknown'}\n` 
        factionInfo += `*➠ Position:* ${user.posisi || 'Unknown'}\n` 
        factionInfo += `*➠ Khodam:* ${user.khodam}\n\n`

        
        const userClanName = Object.keys(keranaii).find(clan => 
            keranaii[clan].Members.some(member => member.id === sender) || 
            keranaii[clan].Leader[sender]
        )

        const clanName = userClanName || 'None'
        const position = userClanName ? 
            (keranaii[userClanName].Leader[sender] ? 'Leader' : 'Member') : 'None'

        let clanCard = `*〘 CLAN CARD 〙*\n`
        clanCard += `*➠ Clan:* ${clanName}\n`
        clanCard += `*➠ Position:* ${position}\n\n`

        // Determine group status and expiry
        let groupStatus = 'Unknown'
        let groupExpired = 'Unknown'

        if (groupID === group_official) {
            groupStatus = 'Official Group Bot'
            groupExpired = 'Permanent'
        } else if (groupID.includes('@s.whatsapp.net')) {
            groupStatus = 'Private Chat Mode'
            groupExpired = 'Private Chat Mode'
        } else {
            const sewa = dewaranai.find(g => g.SewaGpID === groupID)
            if (sewa) {
                groupStatus = 'G Exclusive'
                const expiryDate = new Date(sewa.expired)
                const now = new Date()
                const timeDiff = expiryDate - now
                
                if (timeDiff > 0) {
                    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
                    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
                    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
                    groupExpired = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`
                } else {
                    groupExpired = 'Expired'
                }
            } else {
                groupStatus = 'Illegal Group'
                groupExpired = 'Will Leave Soon'
            }
        }

        let groupInfo = `*〘 GROUP INFO 〙*\n`
        groupInfo += `*➠ Status:* ${groupStatus}\n` 
        groupInfo += `*➠ Expired:* ${groupExpired}\n` 

        let message = userInfo + factionInfo + clanCard + groupInfo

        let ppurl = await Sekai.profilePictureUrl(m.sender, 'image')
            .catch(() => Sekai.profilePictureUrl(m.chat, 'image'))
            .catch(() => "https://mallucampaign.in/images/img_1718464708.jpg")

        Sekai.sendMessage(m.chat, {
            text: message,
            contextInfo: { 
                mentionedJid: [m.sender],
                externalAdReply: { 
                    title: `☃ ${username}`,
                    body: `Level ${level} (${exp}/${nextLevel})`,
                    thumbnailUrl: ppurl,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    } catch (err) {
        console.error('Error in infomain function:', err)
    }
}

async function infomembership(Sekai, m, sender, jmlhsmntr) { 
const informasiMembership = `
Ketik !owner dan hubungi untuk informasi lebih lanjut

*Membership (Waktu Custom)*
- 1 Bulan: 5.000.-
- 2 Bulan: 10.000.-
- 3 Bulan + 1 bulan (4): 15.000.- 
  *Hemat 5.000.-*
- 4 Bulan + 2 bulan (6): 20.000.- 
  *Hemat 10.000.-*
- 5 Bulan + 3 bulan (9): 25.000.- 
  *Hemat 15.000.-*
- Semakin lama Anda membeli, semakin banyak bonus!

*Penawaran Terbaik*
- 1 Tahun + 1 bulan (13): 40.000.- 
  *Hemat 25.000.-*
- Permanen sampai bot dinonaktifkan: 60.000.-

*(G) Exclusive (Waktu Custom)*
- 1 Bulan: 10.000.-
- 2 Bulan: 20.000.-
- 3 Bulan + 1 bulan (4): 30.000.- 
  *Hemat 10.000.-*
- 4 Bulan + 2 bulan (6): 40.000.- 
  *Hemat 20.000.-*
- 5 Bulan + 3 bulan (9): 50.000.- 
  *Hemat 30.000.-*
- Semakin lama Anda membeli, semakin banyak bonus!

*Penawaran Terbaik*
- 1 Tahun + 1 bulan (13): 100.000.- 
  *Hemat 30.000.-*

*Keuntungan Membership:*
✿ Limit Tidak Terbatas
✿ Akses Pesan Pribadi
✿ Akses AI Premium
✿ Akses Fitur Premium
✿ Waktu Cooldown yang Dikurangi

*Keuntungan (G) Exclusive:*
✿ Masuk ke Grup Anda!
✿ Bermain dengan Anggota Lain!
✿ Lindungi Grup Anda dengan Fitur Grup

*Catatan:*
- Sayangnya, untuk (G) Exclusive/Sewa Permanen tidak ada paket.
- Jika Anda membeli (G) Exclusive, Anda akan mendapatkan bonus membership sesuai dengan waktu yang Anda beli.

*Syarat & Ketentuan:*
- Membership tidak akan hilang meskipun bot berganti nomor.
- (G) Exclusive akan kembali lagi jika bola tidak keluar tepat waktu.
- Spamming dan melanggar aturan lain akan secara otomatis menghapus paket yang Anda beli.
- Dengan membeli, Anda menerima syarat dan ketentuan Nusa Sekai.
`
Sekai.sendMessage(m.chat, {
      image: {
        url: "https://telegra.ph/file/8db90af80c68936c29c80.jpg"
      },
      caption: informasiMembership
    }, { quoted: m, ephemeralExpiration: jmlhsmntr })
}

module.exports = {
  mainmenunya,
  infomain,
  infomembership
}