const fs =const fs = require('fs')
const path = require('path')

let bot

const loadBot = () => {
    if (!bot) {
        bot = require('../index.js')
    }
    return bot
}

const loadPlugins = () => {
    const plugins = []
    const files = fs.readdirSync(path.join(__dirname))
    files.forEach(file => {
        if (file.endsWith('.js') && file !== 'menu.js') {
            const plugin = require(`./${file}`)
            plugins.push(plugin)
        }
    })
    return plugins
}

const getCasesFromIndex = () => {
    const indexPath = path.join(__dirname, '../index.js')
    const indexContent = fs.readFileSync(indexPath, 'utf-8')
    const caseRegex = /case\s+['"]([^'"]+)['"]:/g
    const cases = []
    let match
    while ((match = caseRegex.exec(indexContent)) !== null) {
        cases.push(match[1])
    }
    return cases
}

module.exports = {
    command: 'menu',
    helps: 'Menampilkan daftar semua perintah yang tersedia.',
    alias: [],
    tags: ['menu'],
    isOwner: false,
    isGroup: false,
    isPrivate: false,
    handler: (chatId) => {
        const plugins = loadPlugins()
        const cases = getCasesFromIndex()
        let captionnye = 'Daftar Perintah:\n\n'
        plugins.forEach((plugin, index) => {
            captionnye += `${index + 1}. **Command**: ${plugin.command}\n`
            captionnye += `   - **Tags**: ${plugin.tags.length > 0 ? plugin.tags.join(', ') : ' '}\n`
            captionnye += `   - **Alias**: ${plugin.alias.length > 0 ? plugin.alias.join(', ') : ' '}\n\n`
        })
        captionnye += 'Case Menu:\n'
        cases.forEach(caseName => {
            captionnye += `- ${caseName}\n`
        })
        loadBot().sendMessage(chatId, captionnye)
    },
}
