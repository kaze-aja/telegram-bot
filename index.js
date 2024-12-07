const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const { logPrint, logBotStatus } = require('./lib/print')
const { structureFile } = require('./lib/func')


const token = '8036548839:AAHfmrb8nWxaDVbrT2Bn6PEBhaZ1sS4sbg8' // token bot mu
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
    const username = msg.from.username || 'tidak ada'
    const userId = msg.from.id.toString()
    const chatType = msg.chat.type

    const trimText = msg.text.slice(PREFIX.length).trim()
    const [rawCommand, ...args] = trimText.split(/\s+/)
    const command = rawCommand ? rawCommand.toLowerCase() : null
    const text = command ? trimText.slice(rawCommand.length).trim() : trimText

    logPrint(username, chatId, msg.text, command)

    try {
        switch (command) {
            case 'start':
                await bot.sendMessage(chatId, 'Selamat datang! Ketik /menu untuk melihat daftar perintah.')
                break

            case 'struktur':
            if (!text) return bot.sendMessage(chatId, "masukkan path directory nya")
            const res = await structureFile(text)
             await bot.sendMessage(chatId, res)
               break

            case 'ask':
                if (!text) {
                    await bot.sendMessage(chatId, "Apa yang ingin Anda tanyakan?")
                } else {
                    const response = await fetch(`https://loco.web.id/wp-content/uploads/api/v1/bingai.php?q=${encodeURIComponent(text)}`)
                    const data = await response.json()

                    if (data.status) {
                        const aiResponse = data.result.ai_response.replace(/(\[\^.*?\]\[\d\])/g, '')
                        const searchResults = data.result.search_results.map(result => result.url).join(', ')
                        const searchTime = new Date(data.result.search_metadata.search_time).toLocaleString()

                        const messageResponse = `
AI response: ${aiResponse}


Web Search: ${searchResults}
Time: ${searchTime}
                        `

                        await bot.sendMessage(chatId, messageResponse)
                    } else {
                        await bot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data dari AI.')
                    }
                }
                break

            default:
                if (message.startsWith('>') && userId === OWNER_ID) {
                    const evalCmd = message.slice(1).trim()
                    try {
                        const result = await eval(evalCmd)
                        await bot.sendMessage(chatId, util.format(result))
                    } catch (err) {
                        await bot.sendMessage(chatId, util.format(err))
                    }
                } else if (message.startsWith('$') && userId === OWNER_ID) {
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
                    const foundPlugin = plugins.find(plugin => plugin.command === command)
                    if (foundPlugin) {
                        if (foundPlugin.isOwner && userId !== OWNER_ID) {
                            await bot.sendMessage(chatId, 'Hanya Owner saja.')
                        } else if (foundPlugin.isPrivate && chatType !== 'private') {
                            await bot.sendMessage(chatId, 'Berlaku di private chat saja.')
                        } else if (foundPlugin.isGroup && chatType !== 'group') {
                            await bot.sendMessage(chatId, 'Hanya di group saja.')
                        } else {
                            foundPlugin.handler(chatId, msg)
                        }
                    }
                }
                break
        }
    } catch (error) {
        console.error(error)
        await bot.sendMessage(chatId, 'Terjadi kesalahan. Silakan coba lagi nanti.')
    }
})

bot.on('polling_error', (error) => {
    console.error(error)
})

module.exports = bot