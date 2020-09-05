const Telegraf = require("telegraf");
const Markup = require("telegraf/markup");
const Extra = require("telegraf/extra");

const recon = require("./recon");
const { checkCaseLocationByCaseNo } = require("./query");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const showWelcomeMessage = (ctx, onStart = false) => {
  const onStartMessage = onStart
    ? "<b>歡迎使用 wars.vote4.hk \n🤒武漢肺炎民間資訊😷小幫手🕵️‍♀️</b>\n利申第一次寫Telegram Bot，請高抬貴手🙇‍♂️"
    : "有咩幫到你🕵️‍♀️？";
  return ctx.reply(
    onStartMessage,
    Extra.HTML().markup(
      Markup.inlineKeyboard([
        Markup.callbackButton("入 Case No 揾行蹤", "checkCaseLocation"),
        Markup.callbackButton("比較我哋同CHP", "compareCHPandWARS"),
      ])
    )
  );
};
bot.start((ctx) => {
  showWelcomeMessage(ctx, true);
});

bot.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log("Response time: %sms", ms);
});

bot.action("checkCaseLocation", async (ctx) => {
  try {
    ctx.reply(`請打Case No（只限數字...）\n`);

    bot.on("text", async (ctx) => {
      const query = +ctx.message.text;
      if (!Number.isInteger(query)) {
        ctx.reply(`🔢淨係可以打Number`);
        return showWelcomeMessage(ctx);
      }

      ctx.reply(`🕵️‍♀️幫緊你～幫緊你～💦`);

      const { locations, error } = await checkCaseLocationByCaseNo(query);

      if (error) {
        ctx.reply(`中伏，有bug!`);
        return showWelcomeMessage(ctx);
      }

      if (!locations.length) {
        ctx.reply(`咩都揾唔到😩`);
        return showWelcomeMessage(ctx);
      }

      let locationText = "";
      for (const [i, location] of locations.entries()) {
        locationText += `${location.end_date || `202?-??-?? `} | ${
          location.action_zh
        } | ${location.sub_district_zh} | ${location.location_zh}\n`;
      }

      ctx.reply(
        `個案編號：${locations[0].case_no}\n最後出現     | 行蹤 | 地區 | 地點\n${locationText}`
      );
      return showWelcomeMessage(ctx);
    });
  } catch (error) {
    ctx.reply(`中伏，有bug!`);
    console.error(error.stack);
    return showWelcomeMessage(ctx);
  }
});

bot.action("compareCHPandWARS", async (ctx) => {
  try {
    ctx.reply(
      `等朕check下我哋同CHP過往14日地址有咩分別先......(咩都唔好撳，等1-2分鐘先)\n`
    );
    const {
      CaseLocationData,
      notMatchArray,
      error,
    } = await recon.checkMissingGovLocation();

    if (error) {
      ctx.reply(`中伏，有bug!`);
      return showWelcomeMessage(ctx);
    }

    let unMatchText = "Case No 政府地址\n";
    for (const [i, notMatch] of notMatchArray.entries()) {
      unMatchText += `${notMatch.case} ${
        notMatch.location_zh || notMatch.location_en
      }\n`;
    }
    ctx.reply(
      `以下可能係政府有我哋無，亦可能係False Alarm🚨，例如佢哋串錯字🙄\n${unMatchText}我哋有幾多地址: ${CaseLocationData.length} || 有幾多唔中: ${notMatchArray.length}`
    );
    return showWelcomeMessage(ctx);
  } catch (error) {
    ctx.reply(`中伏，有bug!`);
    console.error(error.stack);
    return showWelcomeMessage(ctx);
  }
});

bot.launch();
