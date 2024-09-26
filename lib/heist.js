const fs = require('fs')
const db = require('./databases.js')
const guild = "./src/heist.json"
const team_db = "./src/team.json" 
let premium = JSON.parse(fs.readFileSync('./databases/prem.json'))

function baca_data(filepath) {
    try {
        const data = fs.readFileSync(filepath)
        return JSON.parse(data)
    } catch (error) {
        return {} 
    }
}
function isPremium(user_id) {
    return premium.includes(user_id)
}

function simpan_data(filepath, data) {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2))
}

function randomReward(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateTeamId() {
    return 'T' + Math.floor(1000 + Math.random() * 9000) 
}

/**
 * Mengubah waktu dalam milidetik menjadi format yang lebih terbaca (jam, menit, detik).
 * 
 * @param {number} ms - Waktu dalam milidetik.
 * @returns {string} - Waktu yang diformat dalam jam, menit, dan detik.
 */
function msToTime(ms) {
    let seconds = Math.floor((ms / 1000) % 60)
    let minutes = Math.floor((ms / (1000 * 60)) % 60)
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 24)

    hours = (hours < 10) ? "0" + hours : hours
    minutes = (minutes < 10) ? "0" + minutes : minutes
    seconds = (seconds < 10) ? "0" + seconds : seconds

    return `${hours}:${minutes}:${seconds}`
}

class CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {}
}

class RobCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const id_grup = m.chat
        const id_user = m.sender
        let pengguna = db.getUser(id_user)
        let data_grup = baca_data(guild)[id_grup] || { is_heist: false, amount_rcrystal: 0, guard: 0, cooldown: 0 }
        let team_data = baca_data(team_db)

        data_grup.guard = Math.floor(data_grup.amount_rcrystal / 500)

        const currentTime = Date.now()

        if (currentTime < data_grup.cooldown) {
            let remainingTime = data_grup.cooldown - currentTime
            Sekai.sendMessage(m.chat, { text: `Bank sudah dirob seseorang, silahkan tunggu ${msToTime(remainingTime)} lagi.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }
        if (data_grup.amount_rcrystal <= 0) {
            Sekai.sendMessage(m.chat, { text: "Bank kosong, tidak ada yang bisa dirob lagi." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        let premium_status = isPremium(id_user)
        let user_level = pengguna.level || 1
        let user_team = Object.values(team_data).find(team => team.members.includes(id_user))
        let total_level = user_level
        let premium_bonus = 0
        let total_members = 1 

        if (user_team) {
            total_members = user_team.members.length
            user_team.members.forEach(member_id => {
                let member_data = db.getUser(member_id)
                total_level += member_data.level || 1 
                if (isPremium(member_id)) {
                    premium_bonus += 0.1 
                }
            })
        }

        let base_chance_win = 0.4 + (total_level * 0.05 / total_members) 
        base_chance_win += premium_bonus 

        let team_bonus = (total_members - 1) * 0.05 
        base_chance_win += team_bonus 

        let chance_win = base_chance_win - (data_grup.guard * 0.05)
        if (chance_win < 0) chance_win = 0 

        let win = Math.random() < chance_win

        if (win) {
            let reward_min = 50 * (1 + data_grup.guard)
            let reward_max = 150 * (1 + data_grup.guard)
            let reward = randomReward(reward_min, reward_max) 

            let individual_reward = Math.floor(reward / total_members)

            pengguna.Rcrystal += individual_reward 
            data_grup.amount_rcrystal -= reward 

            Sekai.sendMessage(m.chat, { text: `Sukses! Kamu (bersama tim) mendapatkan total ${reward} Rcrystal. Setiap anggota tim menerima ${individual_reward} Rcrystal. Sisa bank: ${data_grup.amount_rcrystal} Rcrystal.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })

            if (data_grup.amount_rcrystal <= 0) {
                Sekai.sendMessage(m.chat, { text: "Bank telah kosong setelah perampokan ini." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
                data_grup.amount_rcrystal = 0 
            }
        } else {

            let base_penalty = 1000 + (data_grup.guard * 200) + Math.floor(data_grup.amount_rcrystal / 1000) * 50
            let individual_penalty

            if (user_team) {
                individual_penalty = Math.floor(base_penalty / total_members) 

                user_team.members.forEach(member_id => {
                    let member_data = db.getUser(member_id)
                    member_data.exp -= individual_penalty
                })
            } else {
                individual_penalty = base_penalty 
            }

            pengguna.exp -= individual_penalty 

            Sekai.sendMessage(m.chat, { text: `Perampokan gagal. Kamu${user_team ? ' dan timmu' : ''} kehilangan ${individual_penalty} EXP karena penjagaan yang ketat.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
        }

        data_grup.cooldown = currentTime + (30 * 60 * 1000)

        simpan_data(guild, { ...baca_data(guild), [id_grup]: data_grup })
    }
}

class MyTeamCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const team_data = baca_data(team_db)
        const user_team = Object.values(team_data).find(team => team.members.includes(m.sender))

        if (user_team) {
            const teamInfoMessage = `
**Informasi Tim:**
*ID Tim:* ${user_team.id}
*Nama Tim:* ${user_team.team_name}  
*Ketua Tim:* ${user_team.team_leader}
*Anggota:* ${user_team.members.join(', ')}
            `
            Sekai.sendMessage(m.chat, { text: teamInfoMessage }, { quoted: m, ephemeralExpiration: jmlhsmntr })
        } else {
            Sekai.sendMessage(m.chat, { text: "Kamu tidak berada dalam tim mana pun." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
        }
    }
}

class CreateTeamCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const id_user = m.sender
        const team_data = baca_data(team_db)
        const team_id = generateTeamId()
        const team_name = args[1] || `Tim_${team_id}`  

        if (team_data[team_id]) {
            Sekai.sendMessage(m.chat, { text: "Tim dengan ID ini sudah ada, coba lagi." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        team_data[team_id] = {
            id: team_id,
            team_name: team_name,  
            team_leader: id_user,
            members: [id_user]
        }

        simpan_data(team_db, team_data)
        Sekai.sendMessage(m.chat, { text: `Tim berhasil dibuat dengan ID: ${team_id} dan nama: ${team_name}. Kamu adalah ketua tim.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    }
}

class JoinTeamCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const id_user = m.sender
        const team_id = args[1]
        const team_data = baca_data(team_db)

        if (!team_id || !team_data[team_id]) {
            Sekai.sendMessage(m.chat, { text: "ID tim tidak valid." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        if (team_data[team_id].members.includes(id_user)) {
            Sekai.sendMessage(m.chat, { text: "Kamu sudah menjadi anggota tim ini." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        team_data[team_id].members.push(id_user)
        simpan_data(team_db, team_data)
        Sekai.sendMessage(m.chat, { text: `Kamu berhasil bergabung dengan tim: ${team_id}.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    }
}

class LeaveTeamCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const id_user = m.sender
        const team_id = args[1]
        const team_data = baca_data(team_db)

        if (!team_id || !team_data[team_id]) {
            Sekai.sendMessage(m.chat, { text: "ID tim tidak valid." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        if (!team_data[team_id].members.includes(id_user)) {
            Sekai.sendMessage(m.chat, { text: "Kamu bukan anggota tim ini." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        team_data[team_id].members = team_data[team_id].members.filter(member => member !== id_user)
        simpan_data(team_db, team_data)
        Sekai.sendMessage(m.chat, { text: `Kamu berhasil keluar dari tim: ${team_id}.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    }
}

class AddAmountCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const moderator = ["6283113024858@s.whatsapp.net", "6281388934854@s.whatsapp.net", "6283113024858@s.whatsapp.net", "6283834281572@s.whatsapp.net"]
        const id_grup = m.chat
        let data_grup = baca_data(guild)[id_grup] || { amount_rcrystal: 0, guard: 0 }  // Tambahkan guard ke dalam objek

        const id_user = m.sender
        if (!moderator.includes(id_user)) {
            Sekai.sendMessage(m.chat, { text: "Hanya moderator yang bisa menambah jumlah di bank." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        const amount_to_add = parseInt(args[1], 10)
        if (isNaN(amount_to_add) || amount_to_add <= 0) {
            Sekai.sendMessage(m.chat, { text: "Jumlah yang ditambahkan harus berupa angka positif." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        data_grup.amount_rcrystal += amount_to_add
        
        data_grup.guard = Math.floor(data_grup.amount_rcrystal / 100)

        simpan_data(guild, { ...baca_data(guild), [id_grup]: data_grup })

        Sekai.sendMessage(m.chat, { text: `Jumlah ${amount_to_add} Rcrystal telah berhasil ditambahkan ke bank. Total sekarang: ${data_grup.amount_rcrystal} Rcrystal. Jumlah Penjaga sekarang: ${data_grup.guard}` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    }
}

class BankInfoCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const id_grup = m.chat
        let data_grup = baca_data(guild)[id_grup] || { amount_rcrystal: 0, guard: 0 }

        const bankInfoMessage = `
**Informasi Bank:**
*Jumlah Rcrystal:* ${data_grup.amount_rcrystal} Rcrystal
*Jumlah Penjaga:* ${data_grup.guard} 
        `
        Sekai.sendMessage(m.chat, { text: bankInfoMessage }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    }
}

/**
 * Mereset jumlah Rcrystal, jumlah penjaga, dan cooldown bank.
 * 
 * @extends CommandStrategy
 */
class ResetBankCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const moderator = ["6283113024858@s.whatsapp.net", "6281388934854@s.whatsapp.net", "6283113024858@s.whatsapp.net", "6283834281572@s.whatsapp.net"]
        const id_grup = m.chat
        let data_grup = baca_data(guild)[id_grup] || { amount_rcrystal: 0, penjaga: 0, cooldown: 0 }

        const id_user = m.sender
        if (!moderator.includes(id_user)) {
            Sekai.sendMessage(m.chat, { text: "Hanya moderator yang bisa mereset bank." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        data_grup.amount_rcrystal = 0
        data_grup.guard = 0
        data_grup.cooldown = 0
        simpan_data(guild, { ...baca_data(guild), [id_grup]: data_grup })

        Sekai.sendMessage(m.chat, { text: `Bank, penjaga, dan cooldown berhasil direset.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    }
}
/**
 * Menambah jumlah penjaga bank.
 * 
 * @extends CommandStrategy
 */
class AddGuardCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const moderator = ["6283113024858@s.whatsapp.net", "6281388934854@s.whatsapp.net", "6283113024858@s.whatsapp.net", "6283834281572@s.whatsapp.net"]
        const id_grup = m.chat
        let data_grup = baca_data(guild)[id_grup] || { amount_rcrystal: 0, penjaga: 0 }

        const id_user = m.sender
        if (!moderator.includes(id_user)) {
            Sekai.sendMessage(m.chat, { text: "Hanya moderator yang bisa menambah penjaga bank." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        const jumlah_penjaga = parseInt(args[1], 10)
        if (isNaN(jumlah_penjaga) || jumlah_penjaga <= 0) {
            Sekai.sendMessage(m.chat, { text: "Jumlah penjaga yang ditambahkan harus berupa angka positif." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        data_grup.penjaga += jumlah_penjaga
        simpan_data(guild, { ...baca_data(guild), [id_grup]: data_grup })

        Sekai.sendMessage(m.chat, { text: `${jumlah_penjaga} penjaga berhasil ditambahkan. Total penjaga sekarang: ${data_grup.penjaga}.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    }
}
class CommandContext {
    constructor(strategy) {
        this.strategy = strategy
    }

    setStrategy(strategy) {
        this.strategy = strategy
    }

    executeCommand(m, args, Sekai, jmlhsmntr) {
        this.strategy.execute(m, args, Sekai, jmlhsmntr)
    }
}


// heist.js

async function heistgame(m, args, Sekai, jmlhsmntr) {
    const command = args[0]
    const commandContext = new CommandContext()

    switch (command) {
        case 'rob':
            commandContext.setStrategy(new RobCommand())
            break
        case 'team':
            commandContext.setStrategy(new CreateTeamCommand())
            break
        case 'join':
            commandContext.setStrategy(new JoinTeamCommand())
            break
        case 'leave':
            commandContext.setStrategy(new LeaveTeamCommand())
            break
        case 'add':
            commandContext.setStrategy(new AddAmountCommand())
            break
        case 'myteam':
            commandContext.setStrategy(new MyTeamCommand())
            break
        case 'bankinfo':  
            commandContext.setStrategy(new BankInfoCommand())
            break
        case 'reset':
            commandContext.setStrategy(new ResetBankCommand())
            break
        case 'addguard':
            commandContext.setStrategy(new AddGuardCommand())
            break
        case 'info':
            const infoMessage = `
*Tutorial Heist Game:*
1. *heist rob* - Lakukan perampokan bank. Kamu dapat melakukannya sendiri atau bersama tim.
2. *heist team [nama_tim]* - Buat tim untuk melakukan perampokan bersama.
3. *heist join [id_tim]* - Bergabunglah dengan tim yang ada.
4. *heist leave* - Tinggalkan tim saat ini.
5. *heist add [jumlah]* - Tambahkan jumlah Rcrystal ke bank untuk perampokan.
6. *heist myteam* - Melihat informasi mengenai tim yang kamu ikuti.
7. *heist bankinfo* - Melihat informasi bank.
8. *heist reset* - Reset jumlah Rcrystal dan penjaga bank. (Hanya untuk moderator)
9. *heist addguard [jumlah]* - Tambah jumlah penjaga bank. (Hanya untuk moderator)
            `
            Sekai.sendMessage(m.chat, { text: infoMessage }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        default: 
            const defaultMessage = `
**Perintah tidak dikenali. Silakan gunakan .heist info untuk melihat daftar perintah.**
            `
            Sekai.sendMessage(m.chat, { text: defaultMessage }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
    }

    commandContext.executeCommand(m, args, Sekai, jmlhsmntr)
}

module.exports = heistgame