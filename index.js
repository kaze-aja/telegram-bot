const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const { logPrint, logBotStatus } = require('./lib/print')

const token = '' // token bot mu
const bot = new TelegramBot(token, { polling: true })

logBotStatus('Bot telah aktif dan menunggu pesan...')

const PREFIX = '/' // ini prefix bg, ganti aja terserah
const OWNER_ID = '7383767709' // ini id tele mu mas(buat akses fitur owner)

const loadPlugins = () => {
    const plugins = []
    const files = fs.readdirSync(path.join(__dirname, 'plugins'))
    files.forEach(file => {
        const plugin = require(`./plugins/${file}`)
        plugins.push(plugin)
    })
    return plugins
}

const plugins = loadPlugins()

bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    const message = msg.text.toLowerCase()
    const command = message.startsWith(PREFIX) ? message.slice(PREFIX.length).trim() : null
    const username = msg.from.username || 'tidak ada'
    const userId = msg.from.id.toString()
    const chatType = msg.chat.type
    logPrint(username, chatId, msg.text, command)

    switch (command) {
        case 'start':
            bot.sendMessage(chatId, 'Selamat datang! Ketik /menu untuk melihat daftar perintah.')
            break

        case null:
            if (message.startsWith('>') && userId === OWNER_ID) {
                const evalCmd = message.slice(1).trim()
                try {
                    const result = await eval(evalCmd)
                    bot.sendMessage(chatId, util.format(result))
                } catch (err) {
                    bot.sendMessage(chatId, util.format(err))
                }
            } 
            else if (message.startsWith('$') && userId === OWNER_ID) {
                const execCmd = message.slice(1).trim()
                exec(execCmd, (err, stdout, stderr) => {
                    if (err) {
                        return bot.sendMessage(chatId, util.format(err))
                    }
                    if (stderr) {
                        return bot.sendMessage(chatId, util.format(stderr))
                    }
                    if (stdout) {
                        return bot.sendMessage(chatId, util.format(stdout))
                    }
                })
            } else {
                bot.sendMessage(chatId, 'Perintah tidak dikenali. Ketik /menu untuk daftar perintah.')
            }
            break

        default:
            const foundPlugin = plugins.find(plugin => plugin.command === command)
            if (foundPlugin) {
                if (foundPlugin.isOwner && userId !== OWNER_ID) {
                    bot.sendMessage(chatId, 'Hanya Owner saja.')
                } else if (foundPlugin.isPrivate && chatType !== 'private') {
                    bot.sendMessage(chatId, 'Berlaku di private chat saja.')
                } else if (foundPlugin.isGroup && chatType !== 'group') {
                    bot.sendMessage(chatId, 'Hanya di group saja.')
                } else {
                    foundPlugin.handler(chatId, msg)
                }
            } else {
                bot.sendMessage(chatId, 'Perintah tidak dikenali. Ketik /menu untuk daftar perintah.')
            }
    }
})

bot.on('polling_error', (error) => {
    console.error(error)
})

module.exports = bot