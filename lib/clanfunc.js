



const fs = require('fs')
const path = require('path')
const db = require('./databases.js') 
const { settings } = require('../settings.js')
const dbclanPath = path.resolve(__dirname, '../databases/guild.json')

function random_nama_clan() {
    return 'CN' + Math.floor(1000 + Math.random() * 9000) 
}

function ClanHandler() {}

ClanHandler.prototype.readClanDatabase = function() {
    try {
        if (fs.existsSync(dbclanPath)) {
            const data = fs.readFileSync(dbclanPath, 'utf8')
            return JSON.parse(data)
        } else {
            return {} 
        }
    } catch (error) {
        console.error("Error saat membaca database clan:", error)
        return {} 
    }
}

ClanHandler.prototype.saveClanDatabase = function(dbclan) {
    try {
        fs.writeFileSync(dbclanPath, JSON.stringify(dbclan, null, 2), 'utf8')
    } catch (error) {
        console.error("Error saat menyimpan database clan:", error)
        throw error
    }
}

ClanHandler.prototype.joinClan = function(args, m, balas, dbclan, id_pengguna, nick_user) {
    const clan_id = args[1]
    if (!clan_id) return balas(`Masukkan ID Clan yang ingin kamu join!`)
    const target_clan = Object.keys(dbclan).find(clan => dbclan[clan].id === parseInt(clan_id))
    if (!target_clan) return balas(`Clan dengan ID: ${clan_id} tidak ditemukan.`)
    if (this.userClanInfo(dbclan, id_pengguna)) return balas("Kamu sudah menjadi anggota dari clan lain.")

    dbclan[target_clan].Members.push({ id: id_pengguna })
    this.saveClanDatabase(dbclan)
    balas(`Kamu berhasil join clan '${target_clan}'.`)
}

ClanHandler.prototype.userClanInfo = function(dbclan, id_pengguna) {
    return Object.keys(dbclan).find(clan => {
        return dbclan[clan].Members.some(member => member.id === id_pengguna) || 
               dbclan[clan].Leader === id_pengguna
    })
}

ClanHandler.prototype.leaveClan = function(dbclan, id_pengguna, balas) {
    const clanInfo = this.userClanInfo(dbclan, id_pengguna)
    if (!clanInfo) return balas("Kamu tidak berada di clan manapun.")

    const clanName = clanInfo
    dbclan[clanName].Members = dbclan[clanName].Members.filter(member => member.id !== id_pengguna)
    if (dbclan[clanName].Members.length === 0) {
        delete dbclan[clanName]
    }

    this.saveClanDatabase(dbclan)
    balas(`Kamu telah keluar dari clan '${clanName}'.`)
}

ClanHandler.prototype.disbandClan = function(dbclan, id_pengguna, balas) {
    const clanInfo = this.userClanInfo(dbclan, id_pengguna)
    if (!clanInfo) return balas("Kamu tidak berada di clan manapun.")

    const clanName = clanInfo
    if (!dbclan[clanName].Leader[id_pengguna]) return balas("Hanya leader yang bisa membubarkan clan ini.")

    delete dbclan[clanName]
    this.saveClanDatabase(dbclan)
    balas(`Clan '${clanName}' telah dibubarkan.`)
}

ClanHandler.prototype.myInfo = function(dbclan, id_pengguna, balas) {
    const clanInfo = this.userClanInfo(dbclan, id_pengguna) 
    if (!clanInfo) return balas("Kamu tidak berada di clan manapun.")

    const clanName = clanInfo
    const clan = dbclan[clanName]

    const userInfo = clan.Leader === id_pengguna ? "Leader" : "Member"

    const formatted_members = clan.Members
        .map(member => `- ${member.id.split('@')[0]}`)
        .join('\n')

    const leader_id = clan.Leader.split('@')[0] 

    balas(`ID Clan: ${clan.id}\nNama Clan: ${clanName}\nLeader: ${leader_id}\nMembers:\n${formatted_members}`)
}

ClanHandler.prototype.listClan = function(dbclan, balas) {
    const clan_list = Object.keys(dbclan).map(clan_name => {
        const clan = dbclan[clan_name]
        const leader = clan.Leader.replace('@s.whatsapp.net', '')
        const members_count = clan.Members.length

        return `Daftar clan:\nClan: ${clan_name} (${clan.id})\nLeader: +${leader} (${members_count})\n----------------`
    })

    if (clan_list.length === 0) {
        return balas("Tidak ada clan yang tersedia.")
    }

    balas(clan_list.join("\n\n"))
}

ClanHandler.prototype.changeClanName = function(dbclan, id_pengguna, nama_baru, balas) {
    const clanInfo = this.userClanInfo(dbclan, id_pengguna)
    if (!clanInfo) return balas("Kamu tidak berada di clan manapun.")

    const clanName = clanInfo
    const leaderInfo = dbclan[clanName].Leader[id_pengguna]
    if (!leaderInfo) return balas("Hanya leader yang bisa mengganti nama clan ini.")

    if (dbclan[nama_baru]) return balas(`Nama clan '${nama_baru}' sudah digunakan.`)

    dbclan[nama_baru] = { 
        ...dbclan[clanName],
        id: dbclan[clanName].id 
    }

    delete dbclan[clanName]

    this.saveClanDatabase(dbclan)
    balas(`Nama clan berhasil diubah dari '${clanName}' menjadi '${nama_baru}'.`)
}

ClanHandler.prototype.showClan = function(dbclan, clan_id, balas) {
    const target_clan = Object.keys(dbclan).find(clan => dbclan[clan].id === parseInt(clan_id))
    if (!target_clan) return balas(`Clan dengan ID: ${clan_id} tidak ditemukan.`) 

    const clan = dbclan[target_clan]
   if (!Array.isArray(clan.Vice_Lead)) {
        clan.Vice_Lead = []
    }
    if (!Array.isArray(clan.Officers)) {
        clan.Officers = []
    }

    const leader_id = clan.Leader.split('@')[0]
    const formatted_members = clan.Members
        .map(member => `- ${member.id.split('@')[0]}`)
        .join('\n')

    const vice_leads = clan.Vice_Lead.length > 0 ? clan.Vice_Lead.join('\n') : "None"
    const officers = clan.Officers.length > 0 ? clan.Officers.join('\n') : "None"

    this.saveClanDatabase(dbclan)

    balas(`ID Clan: ${clan.id}\nNama Clan: ${target_clan}\nLeader:\n- ${leader_id}\nVice Leads:\n- ${vice_leads}\nOfficers:\n- ${officers}\nMembers:\n${formatted_members}`)
}

ClanHandler.prototype.tutorial = function(balas) {
    const tutorialList = [
        "*.clan create [nama clan]* - Membuat clan baru ( biaya 3000 rcystal )\n",
        "*.clan join [id clan]* - Bergabung dengan clan menggunakan ID\n",
        "*.clan leave* - Keluar dari clan\n",
        "*.clan myinfo* - Menampilkan info clan pengguna\n",
        "*.clan disband* - Membubarkan clan\n",
        "*.clan kick [id pengguna]* - Mengeluarkan anggota dari clan\n",
        "*.clan listclan* - Menampilkan daftar clan yang ada\n",
        "*.clan show [id clan]* - Menampilkan profil clan dengan id clan\n",
        "*.clan promote [tag/reply]* - promote seseorang di clan camu\n",
        "*.clan promotev2 [62xx]* - sama cuman nomer\n",
        "*.clan demote [tag/reply]* - demote seseorang di clan lamu\n",
        "*.clan demotev2 [62xx]* - sama cuman pakai nomer\n",
        "*.clan changename [nama clan baru]* - Mengganti nama clan ( biaya 2000 rcystal )"
    ]

    balas("Daftar Fitur Clan:\n\n" + tutorialList.join("\n"))
}

ClanHandler.prototype.createClan = function(args, m, Sekai, jmlhsmntr, users_main_db, dbclan, id_pengguna, nick_user, SekaiDev, balas) {
    const clan_nama = random_nama_clan()
    const nama_clan = args.slice(1).join(' ') || `clan ${clan_nama}` 

    if (!SekaiDev) {
        if (users_main_db.level < 3) return balas(`Kamu Harus Mencapai Level 3 Terlebih Dahulu Baru Bisa Membuat Clan`)
        if (users_main_db.Rcrystal < 3000) return balas(`Kamu Tidak Mencukupi Untuk Membuat Biaya Pembuatan Clan (3000 Rcrystal)`)
        if (!nama_clan) return balas(`Masukkan Nama Clannya!`)
        if (dbclan[nama_clan]) return balas(`Nama clan '${nama_clan}' sudah digunakan.`)
    }

    if (this.userClanInfo(dbclan, id_pengguna)) return balas("Kamu sudah menjadi anggota dari clan lain.")

    const clan_id = SekaiDev ? 666 : Math.floor(Math.random() * 900) + 100

    dbclan[nama_clan] = {
        id: clan_id,
        Leader: id_pengguna,
        Vice_Lead: [],  
        Officers: [],  
        Members: []
    }

    this.saveClanDatabase(dbclan)
    if (!SekaiDev) users_main_db.Rcrystal -= 3000
    balas(`Clan '${nama_clan}' berhasil dibuat dengan ID: ${clan_id}.`)
}

ClanHandler.prototype.myInfo = function(dbclan, id_pengguna, balas) {

    const clanInfo = this.userClanInfo(dbclan, id_pengguna)
    if (!clanInfo) return balas("Kamu tidak berada di clan manapun.")

    const clanName = clanInfo
    const clan = dbclan[clanName]

    if (!Array.isArray(clan.Vice_Lead)) clan.Vice_Lead = []
    if (!Array.isArray(clan.Officers)) clan.Officers = []

    const leader_id = clan.Leader.split('@')[0]
    const user_id = id_pengguna.split('@')[0]

    const excluded_members = [...clan.Vice_Lead, ...clan.Officers]

    const formatted_members = clan.Members
        .filter(member => {
            const member_id = typeof member === 'string' ? member.split('@')[0] : member.id.split('@')[0]
            return !excluded_members.includes(member) && member_id !== user_id
        })
        .map(member => `- ${typeof member === 'string' ? member.split('@')[0] : member.id.split('@')[0]}`)
        .join('\n') || "None"

    const vice_leads = clan.Vice_Lead
        .map(vice => `- ${vice.split('@')[0]}`)
        .join('\n') || "None"
    const officers = clan.Officers
        .map(officer => `- ${officer.split('@')[0]}`)
        .join('\n') || "None"

    let balasan = `ID Clan: ${clan.id}\nNama Clan: ${clanName}\nLeader:\n- ${leader_id}\n`
    balasan += `Vice Leads:\n${vice_leads}\n`
    balasan += `Officers:\n${officers}\n`
    balasan += `Members:\n${formatted_members}`

    balas(balasan)
}

ClanHandler.prototype.promoteMember = function(dbclan, id_pengguna, targetId, balas) {
    const clanInfo = this.userClanInfo(dbclan, id_pengguna)
    if (!clanInfo) return balas("Kamu tidak berada di clan manapun.")

    const clanName = clanInfo
    const clan = dbclan[clanName]

    if (clan.Leader !== id_pengguna) return balas("Hanya leader yang bisa mempromosikan anggota.")

    const targetMember = clan.Members.find(member => member.id === targetId)
    if (!targetMember) return balas("Anggota dengan ID tersebut tidak ada di clan ini.")

    let currentRole = null
    if (clan.Officers.includes(targetId)) {
        currentRole = 'Officer'
    } else if (clan.Vice_Lead.includes(targetId)) {
        currentRole = 'Vice Lead'
    }

    let newRole = null
    if (!currentRole) {
        newRole = 'Officer'
    } else if (currentRole === 'Officer') {
        newRole = 'Vice Lead'
    } else {
        return balas("Anggota ini sudah menjabat sebagai Vice Lead.")
    }

    if (newRole === 'Vice Lead') {
        clan.Vice_Lead.push(targetId)
        clan.Officers = clan.Officers.filter(id => id !== targetId)
    } else if (newRole === 'Officer') {
        clan.Officers.push(targetId)
    }

    this.saveClanDatabase(dbclan)
    balas(`Anggota dengan ID ${targetId.split('@')[0]} berhasil dipromosikan menjadi ${newRole}.`)
}

ClanHandler.prototype.demoteMember = function(dbclan, id_pengguna, targetId, balas) {
    const clanInfo = this.userClanInfo(dbclan, id_pengguna)
    if (!clanInfo) return balas("Kamu tidak berada di clan manapun.")

    const clanName = clanInfo
    const clan = dbclan[clanName]

    if (clan.Leader !== id_pengguna) return balas("Hanya leader yang bisa mendemotikan anggota.")

    const targetMember = clan.Members.find(member => member.id === targetId)
    if (!targetMember) return balas("Anggota dengan ID tersebut tidak ada di clan ini.")

    let currentRole = null
    if (clan.Vice_Lead.includes(targetId)) {
        currentRole = 'Vice Lead'
    } else if (clan.Officers.includes(targetId)) {
        currentRole = 'Officer'
    }

    let newRole = null
    if (currentRole === 'Vice Lead') {
        newRole = 'Officer'
    } else if (currentRole === 'Officer') {
        newRole = null
    } else {
        return balas("Anggota ini bukan officer atau vice lead.")
    }

    if (currentRole === 'Vice Lead') {
        clan.Vice_Lead = clan.Vice_Lead.filter(id => id !== targetId)
        clan.Officers.push(targetId)
    } else if (currentRole === 'Officer') {
        clan.Officers = clan.Officers.filter(id => id !== targetId)
    }

    this.saveClanDatabase(dbclan)
    balas(`Anggota dengan ID ${targetId.split('@')[0]} berhasil diturunkan menjadi ${newRole ? newRole : 'anggota biasa'}.`)
}

async function clanfunc(args, m, Sekai, jmlhsmntr) {
    function balas(pesannya) {
        Sekai.sendMessage(m.chat, { text: `${pesannya}` }, { quoted: m, ephemeralExpiration: jmlhsmntr })
    }

    const handler = new ClanHandler()
    const dbclan = handler.readClanDatabase()
    const id_pengguna = m.sender
    const SekaiDev = [settings().developer].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
    const users_main_db = db.getUser(m.sender)
    const nick_user = users_main_db.nick
    const clan_id = random_nama_clan()
    const actions = {
        create: () => handler.createClan(args, m, Sekai, jmlhsmntr, users_main_db, dbclan, id_pengguna, nick_user, SekaiDev, balas),
        join: () => handler.joinClan(args, m, balas, dbclan, id_pengguna, nick_user),
        leave: () => handler.leaveClan(dbclan, id_pengguna, balas),
        myinfo: () => handler.myInfo(dbclan, id_pengguna, balas),
        disband: () => handler.disbandClan(dbclan, id_pengguna, balas),
        kick: () => {
            const targetId = args[1]
            if (!targetId) return balas("Masukkan ID anggota yang ingin dikeluarkan.")
            handler.kickMember(dbclan, id_pengguna, targetId, balas)
        },
        listclan: () => handler.listClan(dbclan, balas),
        changename: () => {
            const nama_baru = args.slice(1).join(' ') || `clan ${nama_clan}` 
            if (!nama_baru) return balas("Masukkan nama baru untuk clan!")
            if (users_main_db.Rcrystal < 2000) return balas("Kamu tidak cukup untuk mengganti nama clan (2000 Rcrystal).")

            users_main_db.Rcrystal -= 2000 
            handler.changeClanName(dbclan, id_pengguna, nama_baru, balas)
        },
        show: () => {
            const clan_id = args[1]
            if (!clan_id) return balas("Masukkan ID Clan yang ingin dilihat.")
            handler.showClan(dbclan, clan_id, balas)
        }, 
        promote: () => {
        let who = m.isGroup ? (m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false) : null
         if (!who) return balas(`tag/reply orang yang mau di promote`)

        handler.promoteMember(dbclan, id_pengguna, who, balas)
    },
        promotev2: () => {
        let nomer_text = args[1] + '@s.whatsapp.net'
        if (!nomer_text) return balas(`Contoh: .clan promotev2 62xxx`)

        handler.promoteMember(dbclan, id_pengguna, nomer_text, balas)
    },
        demote: () => {
        let who = m.isGroup ? (m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false) : null
        if (!who) return balas(`tag/reply orang yang mau di demote`)

        handler.demoteMember(dbclan, id_pengguna, who, balas)
    },
        demotev2: () => {
        let nomer_text = args[1] + '@s.whatsapp.net'
        if (!nomer_text) return balas(`Contoh: .clan demotev2 62xxx`)

        handler.demoteMember(dbclan, id_pengguna, who, balas)
    },
        tutorial: () => handler.tutorial(balas)  
    }

    const action = actions[args[0]]
    if (action) {
        action()
    } else {
        balas("Bingung Cara Memakai Fitur Clan? ketik *.clan tutorial* untuk tutorial")
    }
}

module.exports = { clanfunc }

