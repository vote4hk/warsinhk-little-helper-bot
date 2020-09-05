const Telegraf = require("telegraf");
const Markup = require("telegraf/markup");
const Extra = require("telegraf/extra");

const recon = require("./recon");
const { checkCaseLocationByCaseNo } = require("./query");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const showWelcomeMessage = (ctx) => {
  return ctx.reply(
    "<b>歡迎使用 wars.vote4.hk \n🤒武漢肺炎民間資訊😷小幫手🕵️‍♀️</b>\n利申第一次寫Telegram Bot，請高抬貴手🙇‍♂️",
    Extra.HTML().markup(
      Markup.inlineKeyboard([
        Markup.callbackButton(
          "入 Case No 揾行蹤",
          "check_case_location_by_case_no"
        ),
        Markup.callbackButton(
          "比較我哋同CHP",
          "check_missing_location_from_chp"
        ),
      ])
    )
  );
};
bot.start((ctx) => {
  showWelcomeMessage(ctx);
});

bot.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log("Response time: %sms", ms);
});

bot.action("check_case_location_by_case_no", async (ctx) => {
  try {
    ctx.reply(`請打Case No（只限數字...）\n`);

    bot.on("text", async (ctx) => {
      const query = +ctx.message.text;
      if (!Number.isInteger(query)) {
        return ctx.reply(`🔢淨係可以打Number`);
      }

      ctx.reply(`🕵️‍♀️幫緊你～幫緊你～💦`);

      const { locations, error } = await checkCaseLocationByCaseNo(query);

      if (error) {
        return ctx.reply(`中伏，有bug!`);
      }

      if (!locations.length) {
        return ctx.reply(`咩都揾唔到😩`);
      }

      let locationText = "";
      for (const [i, location] of locations.entries()) {
        locationText += `${location.end_date || `202?-??-?? `} | ${
          location.action_zh
        } | ${location.sub_district_zh} | ${location.location_zh}\n`;
      }

      return ctx.reply(
        `個案編號：${locations[0].case_no}\n最後出現     | 行蹤 | 地區 | 地點\n${locationText}`
      );
    });
  } catch (error) {
    ctx.reply(`中伏，有bug!`);
    return console.error(error.stack);
  }
});

bot.action("check_missing_location_from_chp", async (ctx) => {
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
      return ctx.reply(`中伏，有bug!`);
    }

    ctx.reply(`以下可能係政府有我哋無，亦可能係False Alarm，例如佢哋串錯字\n`);
    let unMatchText = "Case No 政府地址\n";
    for (const [i, notMatch] of notMatchArray.entries()) {
      unMatchText += `${notMatch.case} ${
        notMatch.location_zh || notMatch.location_en
      }\n`;
    }
    ctx.reply(unMatchText);
    ctx.reply(
      `我哋有幾多地址: ${CaseLocationData.length} || 有幾多唔中: ${notMatchArray.length}`
    );
  } catch (error) {
    ctx.reply(`中伏，有bug!`);
    return console.error(error.stack);
  }
});

bot.launch();
