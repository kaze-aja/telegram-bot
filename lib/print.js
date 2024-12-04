function logPrint(username, chats, msg, cmd) {
    const logEntry = `[${new Date().toISOString()}] ${username} (${chats}): ${msg} | Command: ${cmd || 'tidak ada'}`
    console.log(logEntry)
}

function logBotStatus(status) {
    const logEntry = `[${new Date().toISOString()}] Bot Status: ${status}`
    console.log(logEntry)
}

module.exports = { logPrint, logBotStatus }
