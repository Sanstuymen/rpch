require('dotenv').config();
const os = require('node:os');
const Discord = require('discord.js-selfbot-v13');
const client = new Discord.Client({
  readyStatus: false,
  checkUpdate: false,
});

const fileNames = [
  'src/config.js',
  'src/database/.gitkeep',
  'src/handler.js',
  'src/lib/api/instagram.js',
  'src/lib/api/play.js',
  'src/lib/api/remini.js',
  'src/lib/api/removebg.js',
  'src/lib/api/spotify.js',
  'src/lib/api/spotifydl.js',
  'src/lib/api/threads.js',
  'src/lib/api/tiktok.js',
  'src/lib/api/twitter.js',
  'src/lib/api/ytmp3.js',
  'src/lib/api/ytmp4.js',
  'src/lib/core/auth/auth.js',
  'src/lib/core/auth/config.js',
  'src/lib/core/auth/core.js',
  'src/lib/core/auth/postgres-auth.js',
  'src/lib/core/connection.js',
  'src/lib/core/database/adapter.js',
  'src/lib/core/database/index.js',
  'src/lib/core/database/postgres-db.js',
  'src/lib/core/database-utils.js',
  'src/lib/core/message.js',
  'src/lib/core/mod.js',
  'src/lib/core/smsg.js',
  'src/lib/core/socket.js',
  'src/lib/core/store/core.js',
  'src/lib/core/store/store.js',
  'src/lib/fetch.js',
  'src/lib/games/crypto.js',
  'src/lib/games/sambung-kata.js',
  'src/lib/games/tictactoe.js',
  'src/lib/games/werewolf/game.js',
  'src/lib/games/werewolf/index.js',
  'src/lib/games/werewolf/phases.js',
  'src/lib/games/werewolf/rewards.js',
  'src/lib/games/werewolf/roles.js',
  'src/lib/games/werewolf/utils.js',
  'src/lib/games/werewolf/voting.js',
  'src/lib/json/kbbi.json',
  'src/lib/json/truth.json',
  'src/lib/json/works.json',
  'src/lib/rpg/constants.js',
  'src/lib/rpg/crafting/helpers.js',
  'src/lib/rpg/crafting/index.js',
  'src/lib/rpg/economy/config.js',
  'src/lib/rpg/economy/index.js',
  'src/lib/rpg/economy/market.js',
  'src/lib/rpg/fishing/baits.js',
  'src/lib/rpg/fishing/config.js',
  'src/lib/rpg/fishing/fish.js',
  'src/lib/rpg/fishing/helpers.js',
  'src/lib/rpg/fishing/index.js',
  'src/lib/rpg/fishing/locations.js',
  'src/lib/rpg/fishing/mutations.js',
  'src/lib/rpg/fishing/rods.js',
  'src/lib/rpg/fishing/shop-stock.js',
  'src/lib/rpg/fishing/system.js',
  'src/lib/rpg/fishing/weather.js',
  'src/lib/rpg/health/index.js',
  'src/lib/rpg/index.js',
  'src/lib/rpg/item/config.js',
  'src/lib/rpg/item/helpers.js',
  'src/lib/rpg/item/index.js',
  'src/lib/rpg/leveling/index.js',
  'src/lib/rpg/mining/config.js',
  'src/lib/rpg/mining/helpers.js',
  'src/lib/rpg/mining/index.js',
  'src/lib/rpg/mining/system.js',
  'src/lib/rpg/registry.js',
  'src/lib/server/web.js',
  'src/lib/shell/cli.sh',
  'src/lib/shell/deps.sh',
  'src/lib/shell/service.sh',
  'src/lib/shell/setup.sh',
  'src/lib/sticker.js',
  'src/lib/system.js',
  'src/lib/uploader.js',
  'src/lib/utils/cooldown.js',
  'src/lib/utils/date.js',
  'src/lib/utils/index.js',
  'src/lib/utils/number.js',
  'src/lib/utils/random.js',
  'src/lib/utils/time.js',
  'src/main.js',
  'src/plugins/ai/copilot.js',
  'src/plugins/ai/feloai.js',
  'src/plugins/downloader/gitclone.js',
  'src/plugins/downloader/ig.js',
  'src/plugins/downloader/spotify.js',
  'src/plugins/downloader/spotifydl.js',
  'src/plugins/downloader/threads.js',
  'src/plugins/downloader/tiktok.js',
  'src/plugins/downloader/twitter.js',
  'src/plugins/downloader/ytaudio.js',
  'src/plugins/downloader/ytplay.js',
  'src/plugins/downloader/ytvideo.js',
  'src/plugins/event/antilink.js',
  'src/plugins/event/auto-tiktok.js',
  'src/plugins/event/autoai.js',
  'src/plugins/event/autoblok.js',
  'src/plugins/event/autolevelup.js',
  'src/plugins/event/autostore.js',
  'src/plugins/event/expired.js',
  'src/plugins/event/premiumcheck.js',
  'src/plugins/features/fishing-reaction.js',
  'src/plugins/game/adventure.js',
  'src/plugins/game/balance.js',
  'src/plugins/game/bomb-ans.js',
  'src/plugins/game/bomb.js',
  'src/plugins/game/buyprem.js',
  'src/plugins/game/buyzc.js',
  'src/plugins/game/casino.js',
  'src/plugins/game/cekshard.js',
  'src/plugins/game/collect.js',
  'src/plugins/game/craft.js',
  'src/plugins/game/crypto.js',
  'src/plugins/game/dare.js',
  'src/plugins/game/depo.js',
  'src/plugins/game/family100-ans.js',
  'src/plugins/game/family100.js',
  'src/plugins/game/fishing.js',
  'src/plugins/game/heal.js',
  'src/plugins/game/inventory.js',
  'src/plugins/game/lb.js',
  'src/plugins/game/market-status.js',
  'src/plugins/game/market.js',
  'src/plugins/game/math-ans.js',
  'src/plugins/game/math.js',
  'src/plugins/game/mine.js',
  'src/plugins/game/rob.js',
  'src/plugins/game/sambungkata-ans.js',
  'src/plugins/game/sambungkata.js',
  'src/plugins/game/switch.js',
  'src/plugins/game/tebakanime-ans.js',
  'src/plugins/game/tebakanime-hint.js',
  'src/plugins/game/tebakanime.js',
  'src/plugins/game/tebakgambar-ans.js',
  'src/plugins/game/tebakgambar-hint.js',
  'src/plugins/game/tebakgambar.js',
  'src/plugins/game/tebakheroml-ans.js',
  'src/plugins/game/tebakheroml-hint.js',
  'src/plugins/game/tebakheroml.js',
  'src/plugins/game/tebakkalimat-ans.js',
  'src/plugins/game/tebakkalimat-hint.js',
  'src/plugins/game/tebakkalimat.js',
  'src/plugins/game/tebakkata-ans.js',
  'src/plugins/game/tebakkata-hint.js',
  'src/plugins/game/tebakkata.js',
  'src/plugins/game/tictactoe-ans.js',
  'src/plugins/game/tictactoe.js',
  'src/plugins/game/transfer.js',
  'src/plugins/game/truth.js',
  'src/plugins/game/wd.js',
  'src/plugins/game/werewolf-ans.js',
  'src/plugins/game/werewolf.js',
  'src/plugins/game/work.js',
  'src/plugins/game/zc.js',
  'src/plugins/group/add.js',
  'src/plugins/group/delete.js',
  'src/plugins/group/demote.js',
  'src/plugins/group/hidetag.js',
  'src/plugins/group/info.js',
  'src/plugins/group/kick.js',
  'src/plugins/group/link.js',
  'src/plugins/group/modebot.js',
  'src/plugins/group/pin.js',
  'src/plugins/group/promote.js',
  'src/plugins/group/revoke.js',
  'src/plugins/group/settings.js',
  'src/plugins/info/dashboard.js',
  'src/plugins/info/database.js',
  'src/plugins/info/listgroup.js',
  'src/plugins/info/menu.js',
  'src/plugins/info/os.js',
  'src/plugins/info/owner.js',
  'src/plugins/info/ping.js',
  'src/plugins/info/report.js',
  'src/plugins/info/runtime.js',
  'src/plugins/info/sc.js',
  'src/plugins/info/totalfitur.js',
  'src/plugins/internet/fetch.js',
  'src/plugins/internet/npm.js',
  'src/plugins/internet/spotify.js',
  'src/plugins/internet/yts.js',
  'src/plugins/maker/brat.js',
  'src/plugins/maker/carbon.js',
  'src/plugins/maker/iqc.js',
  'src/plugins/maker/qc.js',
  'src/plugins/maker/smeme.js',
  'src/plugins/maker/sticker.js',
  'src/plugins/maker/wm.js',
  'src/plugins/owner/addprem.js',
  'src/plugins/owner/bcgc.js',
  'src/plugins/owner/beta.js',
  'src/plugins/owner/clearsession.js',
  'src/plugins/owner/df.js',
  'src/plugins/owner/eval.js',
  'src/plugins/owner/exec.js',
  'src/plugins/owner/expired.js',
  'src/plugins/owner/gconly.js',
  'src/plugins/owner/gf.js',
  'src/plugins/owner/groupstatus.js',
  'src/plugins/owner/join.js',
  'src/plugins/owner/leavegc.js',
  'src/plugins/owner/reload.js',
  'src/plugins/owner/restart.js',
  'src/plugins/owner/self.js',
  'src/plugins/owner/setbiobot.js',
  'src/plugins/owner/setbye.js',
  'src/plugins/owner/setnamebot.js',
  'src/plugins/owner/setppbot.js',
  'src/plugins/owner/sf.js',
  'src/plugins/premium/delsubdomain.js',
  'src/plugins/premium/dls.js',
  'src/plugins/premium/listsubdomain.js',
  'src/plugins/premium/subdomain.js',
  'src/plugins/premium/tosw.js',
  'src/plugins/store/addlist.js',
  'src/plugins/store/dellist.js',
  'src/plugins/store/done.js',
  'src/plugins/store/editlist.js',
  'src/plugins/store/list.js',
  'src/plugins/tool/calculator.js',
  'src/plugins/tool/cekid.js',
  'src/plugins/tool/cekip.js',
  'src/plugins/tool/getlid.js',
  'src/plugins/tool/getq.js',
  'src/plugins/tool/ocr.js',
  'src/plugins/tool/qrcode.js',
  'src/plugins/tool/qris.js',
  'src/plugins/tool/readmore.js',
  'src/plugins/tool/readviewonce.js',
  'src/plugins/tool/remini.js',
  'src/plugins/tool/removebg.js',
  'src/plugins/tool/screenshot.js',
  'src/plugins/tool/shortlink.js',
  'src/plugins/tool/tagme.js',
  'src/plugins/tool/toimg.js',
  'src/plugins/tool/tourl.js',
  'src/plugins/tool/tovideo.js'
];

let startTimestamp;
let extendURL;
let presenceTimer;
let rpcEnabled = false;
let currentChannel = null;

// RPC Functions
function getRandomFile() {
  return fileNames[Math.floor(Math.random() * fileNames.length)];
}

function getRandomInterval() {
  return (Math.floor(Math.random() * 60) + 1) * 60 * 1000;
}

async function updatePresence() {
  const currentFile = getRandomFile();
  console.log(`Now editing: ${currentFile}`);

  const presence = new Discord.RichPresence(client)
    .setApplicationId('1380551344515055667')
    .setType('PLAYING')
    .setState('Workspace: ZumyNext')
    .setName('Visual Studio Code')
    .setDetails(`Editing ${currentFile}`)
    .setStartTimestamp(startTimestamp)
    .setAssetsLargeImage(extendURL[0].external_asset_path)
    .setAssetsLargeText('JavaScript')
    .setAssetsSmallImage('https://cdn.discordapp.com/emojis/1410862047998246942.webp')
    .setAssetsSmallText('Visual Studio Code')
    .setPlatform('desktop')
    .addButton('Community', 'https://discord.gg/W9qD2mYXxf');

  client.user.setPresence({ activities: [presence], status: "idle", });

  const nextInterval = getRandomInterval();
  console.log(`Next update in ${nextInterval / 60000} minutes`);

  if (presenceTimer) {
    clearTimeout(presenceTimer);
  }
  presenceTimer = setTimeout(updatePresence, nextInterval);
}

function startRPC() {
  if (rpcEnabled) return;

  rpcEnabled = true;
  startTimestamp = Date.now() - (os.uptime() * 1000);
  console.log('🟢 RPC Started');
  if (currentChannel) {
    currentChannel.send('🟢 **RPC Started**').catch(() => {});
  }
  updatePresence();
}

function stopRPC() {
  if (!rpcEnabled) return;

  rpcEnabled = false;
  if (presenceTimer) {
    clearTimeout(presenceTimer);
    presenceTimer = null;
  }

  client.user.setPresence({ activities: [], status: "online" });
  console.log('🔴 RPC Stopped');
  if (currentChannel) {
    currentChannel.send('🔴 **RPC Stopped**').catch(() => {});
  }
}



client.on('ready', async () => {
  console.log(`🔗 Logged in as: ${client.user.username}`);
  console.log('Selfbot ready!');
  console.log('RPC will auto-start!');

  extendURL = await Discord.RichPresence.getExternal(
    client,
    '1380551344515055667',
    'https://files.catbox.moe/nawqku.png',
  );
  
  // Auto-start RPC when ready
  startRPC();
});

// Updated message handler
client.on('messageCreate', async (message) => {
  // No message processing needed - RPC runs automatically
  return;
});

if (!process.env.DISCORD_TOKEN) {
  console.error('Error: DISCORD_TOKEN not found in environment variables.');
  process.exit(1);
}

process.on('exit', () => {
  if (presenceTimer) {
    clearTimeout(presenceTimer);
  }
});

client.login(process.env.DISCORD_TOKEN);
