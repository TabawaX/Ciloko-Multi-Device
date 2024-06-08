// main.js + myfunc by DGxeon thanks for that code
// im recode main.js + myfunc a little because there are some errors
require('./settings')
const makeWASocket = require("@whiskeysockets/baileys").default
const { color } = require('./lib/color')
const { settings } = require('./settings.js');
const NodeCache = require("node-cache")
const readline = require("readline")
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const yargs = require('yargs/yargs')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const _ = require('lodash')
const moment = require('moment-timezone')
const PhoneNumber = require('awesome-phonenumber')
const {
	imageToWebp,
	videoToWebp,
	writeExifImg,
	writeExifVid
} = require('./lib/exif')
const {
	smsg,
	isUrl,
	generateMessageTag,
	getBuffer,
	getSizeMedia,
	fetch,
	await,
	sleep,
	reSize
} = require('./lib/myfunc')
const {
	default: SekaiConnect,
	getAggregateVotesInPollMessage,
	delay,
	PHONENUMBER_MCC,
	makeCacheableSignalKeyStore,
	useMultiFileAuthState,
	DisconnectReason,
	fetchLatestBaileysVersion,
	generateForwardMessageContent,
	prepareWAMessageMedia,
	generateWAMessageFromContent,
	generateMessageID,
	downloadContentFromMessage,
	makeInMemoryStore,
	jidDecode,
	proto,
	Browsers
} = require("@whiskeysockets/baileys")

// ++++++++ simpler make memory auth bcs sometimes using stream error +++++++++
const store = makeInMemoryStore({
	logger: pino().child({
		level: 'info',
	})
})
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
// +++++++++++ settings.js ++++++++++
let phoneNumber = settings().pairing
let owner = settings().developer
let setwel = settings().welcome

// +++++++ simpler using true & false instead of --pair or --qr ++++++++++
// ++++++ i recommend useMobile is False +++++++++
const pairingCode = true
const useMobile = false

// +++++ this function (readline) javascript thing, use for quest or enter answer then process it ++++++++
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

// +++++++ this connection by TabawaX ++++++++++
async function SekaiStart() {
	let { version, isLatest } = await fetchLatestBaileysVersion()
	const { state, saveCreds } = await useMultiFileAuthState(`./session`)
	const msgRetryCounterCache = new NodeCache() 
	const Sekai = makeWASocket({
		logger: pino({
			level: 'info'
		}),
		printQRInTerminal: !pairingCode, 
		browser: ['Mac OS', 'chrome', '121.0.6167.159'], 
		patchMessageBeforeSending: (message) => {
			const requiresPatch = !!(
				message.buttonsMessage ||
				message.templateMessage ||
				message.listMessage
			);
			if (requiresPatch) {
				message = {
					viewOnceMessage: {
						message: {
							messageContextInfo: {
								deviceListMetadataVersion: 2,
								deviceListMetadata: {},
							},
							...message,
						},
					},
				};
			}
			return message;
		},
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, pino({
				level: "info"
			})),
		},
		generateHighQualityLinkPreview: true,
		getMessage: async (key) => {
			if (store) {
				const msg = await store.loadMessage(key.remoteJid, key.id)
				return msg.message || undefined
			}
			return Sekai
		},
		msgRetryCounterCache,
	})

	store.bind(Sekai.ev)

   // +++++++++++++++++++
	if (pairingCode && !Sekai.authState.creds.registered) {
		if (useMobile) throw new Error('Cannot use pairing code with mobile api')

		let phoneNumber
		if (!!phoneNumber) {
			phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

			if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
				console.log(chalk.bgBlack(chalk.redBright("Selamat Datang Sayang, Kasih Nomor Kamu Ya")))
				process.exit(0)
			}
		} else {
			phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Mana Nomor Kamu? : `)))
			phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

			
			if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
				console.log(chalk.bgBlack(chalk.redBright("Type Nomor kamu sayang")))

				phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Masukkin Dong sayang : `)))
				phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
				rl.close()
			}
		}

		setTimeout(async () => {
			let code = await Sekai.requestPairingCode(phoneNumber)
			code = code?.match(/.{1,4}/g)?.join("-") || code
			console.log(chalk.black(chalk.bgGreen(`Pairing Kamu Sayang : `)), chalk.black(chalk.white(code)))
		}, 3000)
	} 
	// ++++++ if you can fix "stream errored out* don't forget make pull request in my github ++++++++++
	Sekai.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    try {
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
                console.log(chalk.red('Please delete the session and reconnect.'))
            } else {
                console.log(chalk.yellow('Connection closed, reconnecting...'))
                SekaiStart()
            }
        } else if (connection === 'connecting') {
            console.log(chalk.blue('Connecting...'))
        } else if (connection === 'open') {
            console.log(chalk.green('Connected to WhatsApp!'))
        }
    } catch (err) {
        console.log(chalk.red('Error in Connection.update ' + err))
        SekaiStart()
    }
})
	Sekai.ev.on('creds.update', saveCreds)
	Sekai.ev.on("messages.upsert", () => {})
	
	// +++++++++++++++++++++++++++++++++++++
	
	Sekai.ev.on('group-participants.update', async (anu) => {
		if (setwel) {
			console.log(anu)
			try {
				let metadata = await Sekai.groupMetadata(anu.id)
				let participants = anu.participants
				for (let num of participants) {
					try {
						ppuser = await Sekai.profilePictureUrl(num, 'image')
					} catch (err) {
						ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60'
					}
					try {
						ppgroup = await Sekai.profilePictureUrl(anu.id, 'image')
					} catch (err) {
						ppgroup = 'https://i.ibb.co/RBx5SQC/avatar-group-large-v2.png?q=60'
					}
					// ++++++++ i fixed tagging now able mentioned +++++++++
					memb = metadata.participants.length
					SekaiPP = await getBuffer(ppuser)
					if (anu.action == 'add') {
					    let username = num.match(/^[^@]+/)[0]
						let stext = `Selamat Datang ( @${username} ) Jangan Lupa Membaca Peraturan Atau Engga Kamu Di kick Lho`
						await Sekai.sendMessage(anu.id, {
							image: {
								url: `https://mallucampaign.in/images/img_1716112655.jpg`
							},
							caption: stext, 
							mentions: [num]
						})
					}
				}
			} catch (err) {
				console.log(err)
			}
		}
	});

	
	async function getMessage(key) {
		if (store) {
			const msg = await store.loadMessage(key.remoteJid, key.id)
			return msg?.message
		}
		return Sekai
	}

	Sekai.ev.on('messages.upsert', async chatUpdate => {
		//console.log(JSON.stringify(chatUpdate, undefined, 2))
		try {
			mek = chatUpdate.messages[0]
			if (!mek.message) return
			mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
			if (mek.key && mek.key.remoteJid === 'status@broadcast') return
			if (!Sekai.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
			if (mek.key.id.startsWith('Sekai') && mek.key.id.length === 16) return
			if (mek.key.id.startsWith('BAE5')) return 
			// +++++++ if you can fix/or make ephemeral stable in myfunc.js, don't forget make pull request in my github TabawaX +++++++++++
			m = smsg(Sekai, mek, store)
			require("./app/sekaiGame.js")(Sekai, m, chatUpdate, store)
			require("./app/sekaiCase.js")(Sekai, m, chatUpdate, store)
			require("./app/base.js")(Sekai, m, chatUpdate, store)
		} catch (err) {
			console.log(err)
		}
	})

   // +++++++ this all function like sendFile, getName and etc made BY DGxeon thanks ++++++++++++++
	Sekai.decodeJid = (jid) => {
		if (!jid) return jid
		if (/:\d+@/gi.test(jid)) {
			let decode = jidDecode(jid) || {}
			return decode.user && decode.server && decode.user + '@' + decode.server || jid
		} else return jid
	}

	Sekai.getName = (jid, withoutContact = false) => {
		id = Sekai.decodeJid(jid)
		withoutContact = Sekai.withoutContact || withoutContact
		let v
		if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
			v = store.contacts[id] || {}
			if (!(v.name || v.subject)) v = Sekai.groupMetadata(id) || {}
			resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
		})
		else v = id === '0@s.whatsapp.net' ? {
				id,
				name: 'WhatsApp'
			} : id === Sekai.decodeJid(Sekai.user.id) ?
			Sekai.user :
			(store.contacts[id] || {})
		return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
	}

	Sekai.sendContact = async (jid, kon, quoted = '', opts = {}) => {
		let list = []
		for (let i of kon) {
			list.push({
				displayName: await Sekai.getName(i),
				vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await Sekai.getName(i)}\nFN:${await Sekai.getName(i)}\nitem1.TEL;waid=${i.split('@')[0]}:${i.split('@')[0]}\nitem1.X-ABLabel:Mobile\nEND:VCARD`
			})
		}
		Sekai.sendMessage(jid, {
			contacts: {
				displayName: `${list.length} Contact`,
				contacts: list
			},
			...opts
		}, {
			quoted
		})
	}

	Sekai.public = true

	Sekai.serializeM = (m) => smsg(Sekai, m, store)

	Sekai.sendText = (jid, text, quoted = '', options) => Sekai.sendMessage(jid, {
		text: text,
		...options
	}, {
		quoted,
		...options
	})
	Sekai.sendImage = async (jid, path, caption = '', quoted = '', options) => {
		let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
		return await Sekai.sendMessage(jid, {
			image: buffer,
			caption: caption,
			...options
		}, {
			quoted
		})
	}
	Sekai.sendTextWithMentions = async (jid, text, quoted, options = {}) => Sekai.sendMessage(jid, {
		text: text,
		mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'),
		...options
	}, {
		quoted
	})
	Sekai.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
		let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
		let buffer
		if (options && (options.packname || options.author)) {
			buffer = await writeExifImg(buff, options)
		} else {
			buffer = await imageToWebp(buff)
		}
		await Sekai.sendMessage(jid, {
				sticker: {
					url: buffer
				},
				...options
			}, {
				quoted
			})
			.then(response => {
				fs.unlinkSync(buffer)
				return response
			})
	}

	Sekai.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
		let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
		return await Sekai.sendMessage(jid, {
			audio: buffer,
			ptt: ptt,
			...options
		}, {
			quoted
		})
	}

	Sekai.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options) => {
		let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
		return await Sekai.sendMessage(jid, {
			video: buffer,
			caption: caption,
			gifPlayback: gif,
			...options
		}, {
			quoted
		})
	}

	Sekai.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
		let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
		let buffer
		if (options && (options.packname || options.author)) {
			buffer = await writeExifVid(buff, options)
		} else {
			buffer = await videoToWebp(buff)
		}
		await Sekai.sendMessage(jid, {
			sticker: {
				url: buffer
			},
			...options
		}, {
			quoted
		})
		return buffer
	}
	Sekai.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
		let quoted = message.msg ? message.msg : message
		let mime = (message.msg || message).mimetype || ''
		let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
		const stream = await downloadContentFromMessage(quoted, messageType)
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		let type = await FileType.fromBuffer(buffer)
		trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
		// save to file
		await fs.writeFileSync(trueFileName, buffer)
		return trueFileName
	}

	Sekai.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
		let mime = '';
		let res = await axios.head(url)
		mime = res.headers['content-type']
		if (mime.split("/")[1] === "gif") {
			return Sekai.sendMessage(jid, {
				video: await getBuffer(url),
				caption: caption,
				gifPlayback: true,
				...options
			}, {
				quoted: quoted,
				...options
			})
		}
		let type = mime.split("/")[0] + "Message"
		if (mime === "application/pdf") {
			return Sekai.sendMessage(jid, {
				document: await getBuffer(url),
				mimetype: 'application/pdf',
				caption: caption,
				...options
			}, {
				quoted: quoted,
				...options
			})
		}
		if (mime.split("/")[0] === "image") {
			return Sekai.sendMessage(jid, {
				image: await getBuffer(url),
				caption: caption,
				...options
			}, {
				quoted: quoted,
				...options
			})
		}
		if (mime.split("/")[0] === "video") {
			return Sekai.sendMessage(jid, {
				video: await getBuffer(url),
				caption: caption,
				mimetype: 'video/mp4',
				...options
			}, {
				quoted: quoted,
				...options
			})
		}
		if (mime.split("/")[0] === "audio") {
			return Sekai.sendMessage(jid, {
				audio: await getBuffer(url),
				caption: caption,
				mimetype: 'audio/mpeg',
				...options
			}, {
				quoted: quoted,
				...options
			})
		}
	}

	Sekai.getFile = async (PATH, save) => {
		let res
		let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
		//if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
		let type = await FileType.fromBuffer(data) || {
			mime: 'application/octet-stream',
			ext: '.bin'
		}
		filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
		if (data && save) fs.promises.writeFile(filename, data)
		return {
			res,
			filename,
			size: await getSizeMedia(data),
			...type,
			data
		}

	}

	Sekai.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
		let type = await Sekai.getFile(path, true);
		let {
			res,
			data: file,
			filename: pathFile
		} = type;

		if (res && res.status !== 200 || file.length <= 65536) {
			try {
				throw {
					json: JSON.parse(file.toString())
				};
			} catch (e) {
				if (e.json) throw e.json;
			}
		}

		let opt = {
			filename
		};

		if (quoted) opt.quoted = quoted;
		if (!type) options.asDocument = true;

		let mtype = '',
			mimetype = type.mime,
			convert;

		if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
		else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
		else if (/video/.test(type.mime)) mtype = 'video';
		else if (/audio/.test(type.mime)) {
			convert = await (ptt ? toPTT : toAudio)(file, type.ext);
			file = convert.data;
			pathFile = convert.filename;
			mtype = 'audio';
			mimetype = 'audio/ogg; codecs=opus';
		} else mtype = 'document';

		if (options.asDocument) mtype = 'document';

		delete options.asSticker;
		delete options.asLocation;
		delete options.asVideo;
		delete options.asDocument;
		delete options.asImage;

		let message = {
			...options,
			caption,
			ptt,
			[mtype]: {
				url: pathFile
			},
			mimetype
		};
		let m;

		try {
			m = await Sekai.sendMessage(jid, message, {
				...opt,
				...options
			});
		} catch (e) {
			//console.error(e)
			m = null;
		} finally {
			if (!m) m = await Sekai.sendMessage(jid, {
				...message,
				[mtype]: file
			}, {
				...opt,
				...options
			});
			file = null;
			return m;
		}
	}

	Sekai.cMod = (jid, copy, text = '', sender = Sekai.user.id, options = {}) => {
		//let copy = message.toJSON()
		let mtype = Object.keys(copy.message)[0]
		let isEphemeral = mtype === 'ephemeralMessage'
		if (isEphemeral) {
			mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
		}
		let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
		let content = msg[mtype]
		if (typeof content === 'string') msg[mtype] = text || content
		else if (content.caption) content.caption = text || content.caption
		else if (content.text) content.text = text || content.text
		if (typeof content !== 'string') msg[mtype] = {
			...content,
			...options
		}
		if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
		else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
		if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
		else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
		copy.key.remoteJid = jid
		copy.key.fromMe = sender === Sekai.user.id

		return proto.WebMessageInfo.fromObject(copy)
	}

	Sekai.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
		let types = await Sekai.getFile(path, true)
		let {
			mime,
			ext,
			res,
			data,
			filename
		} = types
		if (res && res.status !== 200 || file.length <= 65536) {
			try {
				throw {
					json: JSON.parse(file.toString())
				}
			} catch (e) {
				if (e.json) throw e.json
			}
		}
		let type = '',
			mimetype = mime,
			pathFile = filename
		if (options.asDocument) type = 'document'
		if (options.asSticker || /webp/.test(mime)) {
			let {
				writeExif
			} = require('./lib/exif')
			let media = {
				mimetype: mime,
				data
			}
			pathFile = await writeExif(media, {
				packname: options.packname ? options.packname : global.packname,
				author: options.author ? options.author : global.author,
				categories: options.categories ? options.categories : []
			})
			await fs.promises.unlink(filename)
			type = 'sticker'
			mimetype = 'image/webp'
		} else if (/image/.test(mime)) type = 'image'
		else if (/video/.test(mime)) type = 'video'
		else if (/audio/.test(mime)) type = 'audio'
		else type = 'document'
		await Sekai.sendMessage(jid, {
			[type]: {
				url: pathFile
			},
			caption,
			mimetype,
			fileName,
			...options
		}, {
			quoted,
			...options
		})
		return fs.promises.unlink(pathFile)
	}

	Sekai.copyNForward = async (jid, message, forceForward = false, options = {}) => {
		let vtype
		if (options.readViewOnce) {
			message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
			vtype = Object.keys(message.message.viewOnceMessage.message)[0]
			delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
			delete message.message.viewOnceMessage.message[vtype].viewOnce
			message.message = {
				...message.message.viewOnceMessage.message
			}
		}
		let mtype = Object.keys(message.message)[0]
		let content = await generateForwardMessageContent(message, forceForward)
		let ctype = Object.keys(content)[0]
		let context = {}
		if (mtype != "conversation") context = message.message[mtype].contextInfo
		content[ctype].contextInfo = {
			...context,
			...content[ctype].contextInfo
		}
		const waMessage = await generateWAMessageFromContent(jid, content, options ? {
			...content[ctype],
			...options,
			...(options.contextInfo ? {
				contextInfo: {
					...content[ctype].contextInfo,
					...options.contextInfo
				}
			} : {})
		} : {})
		await Sekai.relayMessage(jid, waMessage.message, {
			messageId: waMessage.key.id
		})
		return waMessage
	}

	Sekai.sendPoll = (jid, name = '', values = [], selectableCount = 1) => {
		return Sekai.sendMessage(jid, {
			poll: {
				name,
				values,
				selectableCount
			}
		})
	}

	Sekai.parseMention = (text = '') => {
		return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
	}

	Sekai.downloadMediaMessage = async (message) => {
		let mime = (message.msg || message).mimetype || ''
		let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
		const stream = await downloadContentFromMessage(message, messageType)
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}

		return buffer
	}
	return Sekai
}

SekaiStart()

process.on('uncaughtException', function(err) {
	let e = String(err)
	if (e.includes("conflict")) return
	if (e.includes("Cannot derive from empty media key")) return
	if (e.includes("Socket connection timeout")) return
	if (e.includes("not-authorized")) return
	if (e.includes("already-exists")) return
	if (e.includes("rate-overlimit")) return
	if (e.includes("Connection Closed")) return
	if (e.includes("Timed Out")) return
	if (e.includes("Value not found")) return
	console.log('Caught exception: ', err)
})
