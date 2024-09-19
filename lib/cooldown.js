const fs = require('fs')
const db = require('./databases.js')
let premium = JSON.parse(fs.readFileSync('./databases/prem.json'))
const {
    addPremiumUser,
    getPremiumExpired,
    getPremiumPosition,
    expiredPremiumCheck,
    checkPremiumUser,
    getAllPremiumUser,
} = require('./premium.js')

const { settings } = require('../settings.js')

const userCooldowns = new Map()

async function checkUserCooldown(command, sender, Sekai, m, jmlhsmntr) {
    function balas(pesannya) {
        try {
            Sekai.sendMessage(m.chat, { text: pesannya }, { quoted: m, ephemeralExpiration: jmlhsmntr })
        } catch (error) {
            console.error("Error saat mengirim pesan:", error)
            throw error
        }
    }

    const SekaiDev = [settings().developer].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(sender)
    
    const data = JSON.parse(fs.readFileSync('./databases/sewa.json', 'utf8'))
    const isVipGc = data.some(entry => entry.SewaGpID === m.chat && entry.vip_status === true)
    const isPremium = checkPremiumUser(sender, premium)

    let cooldownAmount
    if (SekaiDev) {
        cooldownAmount = 5000 // 5 detik 
    } else if (isVipGc) {
        cooldownAmount = 10000 // 10 detik 
    } else if (isPremium) {
        cooldownAmount = 10000 // 10 detik 
    } else {
        cooldownAmount = 120000 // 2 menit 
    }

    const now = Date.now()

    if (!userCooldowns.has(sender)) {
        userCooldowns.set(sender, new Map())
    }

    const userCommands = userCooldowns.get(sender)

    if (!userCommands.has(command)) {
        userCommands.set(command, 0)
    }

    const lastExecutionTime = userCommands.get(command)
    const elapsedTime = now - lastExecutionTime

    if (elapsedTime < cooldownAmount) {
        let remainingTime = cooldownAmount - elapsedTime
        let minutes = Math.floor(remainingTime / 60000)
        let seconds = Math.ceil((remainingTime % 60000) / 1000)

        let timeMessage = ''
        if (minutes > 0) {
            timeMessage += `${minutes} menit `
        }
        timeMessage += `${seconds} detik`

        if (SekaiDev) {
            balas(`Owner Yang Baik Tunggu *${timeMessage}* yah untuk mu`)
            return true
        }
        if (isPremium) {
            balas(`Dear Premium User, Karena Kamu Premium Tunggu *${timeMessage}* Saja Ya`)
            return true
        }
        if (isVipGc) {
            balas(`Halo Penghuni Grup VIP!, Kamu Hanya Perlu Menunggu *${timeMessage}* saja yah!, enjoy! terimakasih telah membeli layanan kami`)
            return true
        }
        balas(`Kamu Perlu Menunggu *${timeMessage}* Untuk Menggunakan Commands\n\nKamu Dapat Membeli *!premium* Untuk Mengirangi Cooldown`)
        return true
    } else {
        userCommands.set(command, now)
        return false
    }
}

module.exports = {
    checkUserCooldown,
}