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
        const id_user = m.sender
        let premium_status = isPremium(id_user)
        let pengguna = db.getUser(id_user)
        const isVipGc = JSON.parse(fs.readFileSync('./databases/sewa.json', 'utf8')).some(entry => entry.SewaGpID === m.chat && entry.vip_status === true)
        let data_bank = baca_data(guild) || { is_heist: false, amount_rcrystal: 0, guard: 0, cooldown: 0 }

        if (!premium_status && !isVipGc) {
           if (pengguna.limit > 4) {
                pengguna.limit -= 4
              } else {
                  return Sekai.sendMessage(m.chat, { text: `Membutuhkan 4 Limit untuk merampok bank global` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            }
       }

        data_bank.guard = Math.floor(data_bank.amount_rcrystal / 500)

        const currentTime = Date.now()

        if (currentTime < data_bank.cooldown) {
            let remainingTime = data_bank.cooldown - currentTime
            Sekai.sendMessage(m.chat, { text: `Bank sudah dirob seseorang, silahkan tunggu ${msToTime(remainingTime)} lagi.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }
        if (data_bank.amount_rcrystal <= 0) {
            Sekai.sendMessage(m.chat, { text: "Bank kosong, tidak ada yang bisa dirob lagi." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        let user_level = pengguna.level || 1
        let user_team = Object.values(baca_data(team_db)).find(team => team.members.includes(id_user))
        let total_level = user_level
        let premium_bonus = premium_status ? 0.1 : 0
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

        let difficulty_penalty = 0
        if (user_team) {
            difficulty_penalty += 0.15 
        }

        let chance_win = base_chance_win - (data_bank.guard * 0.08) - difficulty_penalty
        if (chance_win < 0) chance_win = 0 

        let win = Math.random() < chance_win

        if (win) {
            let reward_min = 50 * (1 + data_bank.guard)
            let reward_max = 150 * (1 + data_bank.guard)
            let reward = randomReward(reward_min, reward_max) 

            let premium_multiplier = premium_status ? 1.1 : 1 
            reward = Math.floor(reward * premium_multiplier)

            let individual_reward = Math.floor(reward / total_members)

            pengguna.Rcrystal += individual_reward 
            data_bank.amount_rcrystal -= reward 

            Sekai.sendMessage(m.chat, { text: `Sukses! Kamu (bersama tim) mendapatkan total ${reward} Rcrystal. Setiap anggota tim menerima ${individual_reward} Rcrystal. Sisa bank: ${data_bank.amount_rcrystal} Rcrystal.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })

            if (data_bank.amount_rcrystal <= 0) {
                Sekai.sendMessage(m.chat, { text: "Bank telah kosong setelah perampokan ini." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
                data_bank.amount_rcrystal = 0 
            }
        } else {
            let base_penalty = 1000 + (data_bank.guard * 200) + Math.floor(data_bank.amount_rcrystal / 1000) * 50
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

            let premium_penalty_reduction = premium_status ? 0.8 : 1 
            individual_penalty = Math.floor(individual_penalty * premium_penalty_reduction)

            pengguna.exp -= individual_penalty 

            Sekai.sendMessage(m.chat, { text: `Perampokan gagal. Kamu${user_team ? ' dan timmu' : ''} kehilangan ${individual_penalty} EXP karena penjagaan yang ketat.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
        }

        data_bank.cooldown = currentTime + (30 * 60 * 1000) 

        simpan_data(guild, data_bank)
    }
}

class StatCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const id_user = m.sender
        const pengguna = db.getUser(id_user)
        const premium_status = isPremium(id_user)
        const data_bank = baca_data(guild) || { is_heist: false, amount_rcrystal: 0, guard: 0, cooldown: 0 }
        const user_team = Object.values(baca_data(team_db)).find(team => team.members.includes(id_user))
        const user_level = pengguna.level || 1
        const total_bank_guard = data_bank.guard

        let total_team_level = user_level
        let total_team_members = 1
        let premium_bonus = premium_status ? 0.1 : 0
        let difficulty_penalty = 0

        if (user_team) {
            total_team_members = user_team.members.length
            user_team.members.forEach(member_id => {
                let member_data = db.getUser(member_id)
                total_team_level += member_data.level || 1
                if (isPremium(member_id)) {
                    premium_bonus += 0.1 
                }
            })
            difficulty_penalty = 0.15 
        }

        const base_chance_win = 0.4 + (total_team_level * 0.05 / total_team_members) + premium_bonus
        const team_bonus = (total_team_members - 1) * 0.05 
        const guard_penalty = total_bank_guard * 0.08 
        const chance_win = Math.max(0, base_chance_win + team_bonus - guard_penalty - difficulty_penalty)

        const buff_debuff_details = `
**Detail Buff & Debuff:**
*Premium Bonus:* ${(premium_bonus * 100).toFixed(2)}%
    - Bonus diberikan berdasarkan status premium anggota tim (termasuk pengguna sendiri).
    - Setiap anggota tim premium menambah 10% peluang.

*Penalti Tim Besar:* ${(difficulty_penalty * 100).toFixed(2)}%
    - Penalti sebesar 15% diberikan jika pengguna dalam tim.

*Bonus Tim:* ${(team_bonus * 100).toFixed(2)}%
    - Setiap anggota tim (di luar pengguna) menambah 5% peluang.

*Penjaga Bank:* ${total_bank_guard} Penjaga
    - Setiap penjaga menurunkan peluang sebesar 8% per penjaga.
        `

        const user_stat_message = `
**Statistik Perampokan:**
*Level Pengguna:* ${user_level}
*Total Level Tim:* ${total_team_level} (dengan ${total_team_members} anggota)
*Penjaga Bank:* ${total_bank_guard}
*Buff Premium:* ${(premium_bonus * 100).toFixed(2)}%
*Penalti Tim:* ${(difficulty_penalty * 100).toFixed(2)}%
*Bonus Tim:* ${(team_bonus * 100).toFixed(2)}%
*Penalti Penjaga:* ${(guard_penalty * 100).toFixed(2)}%
*Peluang Keberhasilan:* ${(chance_win * 100).toFixed(2)}%
        `

        Sekai.sendMessage(m.chat, { text: user_stat_message + buff_debuff_details }, { quoted: m, ephemeralExpiration: jmlhsmntr })
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

class MyTeamCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const team_data = baca_data(team_db)
        const user_team = Object.values(team_data).find(team => team.members.includes(m.sender))

        if (user_team) {

            const sorted_members = user_team.members
                .map(member => member.replace('@s.whatsapp.net', '')) 
                .sort() 

            const teamInfoMessage = `
**Informasi Tim:**
*ID Tim:* ${user_team.id}
*Nama Tim:* ${user_team.team_name}  
*Ketua Tim:* ${user_team.team_leader.replace('@s.whatsapp.net', '')}
*Anggota:* 
${sorted_members.map(member => `- ${member}`).join('\n')}
            `
            Sekai.sendMessage(m.chat, { text: teamInfoMessage }, { quoted: m, ephemeralExpiration: jmlhsmntr })
        } else {
            Sekai.sendMessage(m.chat, { text: "Kamu tidak berada dalam tim mana pun." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
        }
    }
}

class JoinTeamCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const id_user = m.sender
        const team_data = baca_data(team_db)
        const current_team = Object.values(team_data).find(team => team.members.includes(id_user))

        if (current_team) {
            Sekai.sendMessage(m.chat, { text: "Kamu sudah berada dalam sebuah tim. Silakan keluar dari tim sebelum bergabung dengan tim lain, Ketik *!heist leave [id tim]*" }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        const team_id = args[1]
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

function simpan_data(filepath, data) {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2))
}

class AddAmountCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const moderator = ["6283113024858@s.whatsapp.net", "6281388934854@s.whatsapp.net", "6283113024858@s.whatsapp.net", "6283834281572@s.whatsapp.net"]
        const id_grup = m.chat
        let data_bank = baca_data(guild) || { is_heist: false, amount_rcrystal: 0, guard: 0, cooldown: 0 }

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

        data_bank.amount_rcrystal = (data_bank.amount_rcrystal || 0) + amount_to_add
        data_bank.guard = Math.floor(data_bank.amount_rcrystal / 100) 
        simpan_data(guild, data_bank)
        Sekai.sendMessage(m.chat, { text: `Jumlah ${amount_to_add} Rcrystal telah berhasil ditambahkan ke bank. Total sekarang: ${data_bank.amount_rcrystal} Rcrystal. Jumlah Penjaga sekarang: ${data_bank.guard}` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    }
}

class BankInfoCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const id_grup = m.chat
        let data_bank = baca_data(guild) || { is_heist: false, amount_rcrystal: 0, guard: 0, cooldown: 0 }

        const bankInfoMessage = `
**Informasi Bank:**
*Jumlah Rcrystal:* ${data_bank.amount_rcrystal} Rcrystal
*Jumlah Penjaga:* ${data_bank.guard} 
        `
        simpan_data(guild, data_bank)
        Sekai.sendMessage(m.chat, { text: bankInfoMessage }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    }
}

class ResetBankCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const moderator = ["6283113024858@s.whatsapp.net", "6281388934854@s.whatsapp.net", "6283113024858@s.whatsapp.net", "6283834281572@s.whatsapp.net"]
        const id_grup = m.chat
        let data_bank = baca_data(guild) || { is_heist: false, amount_rcrystal: 0, guard: 0, cooldown: 0 }

        const id_user = m.sender
        if (!moderator.includes(id_user)) {
            Sekai.sendMessage(m.chat, { text: "Hanya moderator yang bisa mereset bank." }, { quoted: m, ephemeralExpiration: jmlhsmntr })
            return
        }

        data_bank.amount_rcrystal = 0
        data_bank.guard = 0
        data_bank.cooldown = 0
        simpan_data(guild, data_bank)

        Sekai.sendMessage(m.chat, { text: `Bank, penjaga, dan cooldown berhasil direset.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    }
}

class AddGuardCommand extends CommandStrategy {
    execute(m, args, Sekai, jmlhsmntr) {
        const moderator = ["6283113024858@s.whatsapp.net", "6281388934854@s.whatsapp.net", "6283113024858@s.whatsapp.net", "6283834281572@s.whatsapp.net"]
        const id_grup = m.chat
        let data_bank = baca_data(guild) || { is_heist: false, amount_rcrystal: 0, guard: 0, cooldown: 0 }

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

        data_bank.guard+= jumlah_penjaga
        simpan_data(guild, data_bank)

        Sekai.sendMessage(m.chat, { text: `${jumlah_penjaga} penjaga berhasil ditambahkan. Total penjaga sekarang: ${data_bank.guard}.` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
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
        case 'stats':  
            commandContext.setStrategy(new StatCommand())
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
10. *heist stats* - melihat stats presentase bank/team/user
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