const Telegraf = require('telegraf')
const recon = require("./recon")
require('dotenv').config()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log('Response time: %sms', ms)
  })

bot.start((ctx) => ctx.reply('歡迎使用 wars.vote4.hk 🤒武漢肺炎民間資訊😷小幫手，利申第一次寫Telegram Bot，請多多包涵🙇‍♂️\n請輸入 /check_gov 開始'))
bot.hears('/check_gov', async ctx => {
    ctx.reply(`等朕check下我哋同CHP過往14日地址有咩分別先......(咩都唔好撳，等1-2分鐘先)\n`)
    const { CaseLocationData, notMatchArray, error} = await recon.checkMissingGovLocation()

    if (error) {
        ctx.reply(`中伏，有bug!`)
        ctx.reply(result.error)
        return
    }
    
    ctx.reply(`以下可能係政府有我哋無，亦可能係False Alarm，例如佢哋串錯字\n`)
    let unMatchText = 'Case No 政府地址\n'
    for (const [i, notMatch] of notMatchArray.entries()) {
        unMatchText += `${notMatch.case} ${notMatch.location_zh || notMatch.location_en}\n`
    }
    ctx.reply(unMatchText)
    ctx.reply(`我哋有幾多地址: ${CaseLocationData.length} || 有幾多唔中: ${notMatchArray.length}`)
})
bot.launch()