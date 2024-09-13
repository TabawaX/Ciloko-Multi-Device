/**
 * Module pesan untuk mengambil dan mengacak pesan dari objek pesan.
 * 
 * @module pesan
 */

const pesan = {
    error: {
        message_error1: "Lg ga mood",
        message_error2: "nanti aja g mood",
        message_error3: "apasih ga usah sok asik lagi ga mood",
        get random() {
            const errors = [this.message_error1, this.message_error2, this.message_error3]
            return errors[Math.floor(Math.random() * errors.length)]
        }
    },
    onlyadmin: {
        message_admin1: "kmu member jelata",
        message_admin2 : "Jadi Admin Dulu",
        message_admin3 : "minimal kamu admin dulu",
        get random() {
            const onlyadm = [this.message_admin1, this.message_admin2, this.message_admin3]
            return onlyadm[Math.floor(Math.random() * onlyadm.length)]
        }
    },
    onlydev: {
        message_dev1 : "khusus abang tabawa :3",
        message_dev2 : "Kamu Bukan Developer",
        message_dev3 : "maaf kamu bukan suamiku ( tabawa )",
        get random() {
            const onlydev = [this.message_dev1, this.message_dev2, this.message_dev3]
            return onlydev[Math.floor(Math.random() * onlydev.length)]
        }
    },
    botadm: {
        message_bot1  : "MINIMAL aku jadiin admin dulu",
        message_bot2 : "ak ga mau kerjain klo ga di jadiin admin",
        message_bot3 : "mls klo kamu jadiin aku admin nanti aku kerjain",
        get random() {
            const botadm = [this.message_bot1, this.message_bot2, this.message_bot3]
            return botadm[Math.floor(Math.random() * botadm.length)]
        }
    },
    limit: {
        message_limit1  : "Kamu Kehabisan Limit nih :( , yul beli *!premium* agar unlimited limit",
        message_limit2 : "waduh kehabisan limit ya?, beli *!premium* kalo mau unliminitid",
        message_limit3 : "yahahaha habis limit?, makannya jadi *!premium* biar limitnya nggak terbatas",
        get random() {
            const msglimit = [this.message_limit1, this.message_limit2, this.message_limit3]
            return msglimit[Math.floor(Math.random() * msglimit.length)]
        }
    },
    process: {
        message_procces: "Sbr...",
        message_procces1: "tunggu y...",
        message_procces2: "oke....",
        message_procces3: "proses....",
        get random() {
            const processes = [this.message_procces, this.message_procces1, this.message_procces2, this.message_procces3]
            return processes[Math.floor(Math.random() * processes.length)]
        }
    }
}

module.exports = pesan