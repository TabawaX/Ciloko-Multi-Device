const count = new Map()
const RESET_INTERVAL = 3000 

/**
 * Mendeteksi spam dan melakukan aksi jika jumlah pesan melebihi batas
 * 
 * @param {object} m - Objek pesan yang diterima.
 * @param {object} Sekai - Objek Sekai.js.
 * @param {number} jmlhsmntr - Ephemeral expiration.
 * @param {boolean} isAdmins - Apakah pengirim pesan adalah admin.
 * @param {boolean} SekaiDev - Apakah pengirim pesan adalah developer.
 */
async function AntiSpam(m, Sekai, jmlhsmntr, isAdmins, SekaiDev) {
    const user_id = m.sender
    const grup_id = m.chat

    if (!count.has(grup_id)) {
        count.set(grup_id, new Map())
    }
    const groupCount = count.get(grup_id)

    if (!groupCount.has(user_id)) {
        groupCount.set(user_id, { message_count: 0, first_message_time: Date.now() })
    }
    const userCount = groupCount.get(user_id)
    const now = Date.now()

    if (now - userCount.first_message_time > RESET_INTERVAL) {
     //   console.log("reset")
        userCount.message_count = 0 
        userCount.first_message_time = now 
    }

    userCount.message_count += 1

 //  console.log(`Pesan dari @${user_id.split('@')[0]}: ${userCount.message_count} pesan dalam ${RESET_INTERVAL}ms`)

    if (userCount.message_count >= 5) {
        if (isAdmins || m.key.fromMe || SekaiDev) {
            return // console.log("admin atau developer, abaikan deteksi spam")
        }

        const teks1 = `Heiii @${user_id.split('@')[0]} Kamu terdeteksi Spam!!! Kamu akan langsung aku kick, bay bay`
        await Sekai.sendMessage(grup_id, {
            text: teks1,
            mentions: [user_id]
        }, {
            quoted: m,
            ephemeralExpiration: jmlhsmntr
        })

        await Sekai.groupParticipantsUpdate(grup_id, [user_id], 'remove')

        userCount.message_count = 0
        userCount.first_message_time = now
    }
}

module.exports = { AntiSpam }