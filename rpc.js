require('dotenv').config();
const os = require('node:os');
const Discord = require('discord.js-selfbot-v13');
const client = new Discord.Client({
  readyStatus: false,
  checkUpdate: false,
});

const fileNames = [
  'main.js',
  'server.js',
  'index.js',
  'config.js',
  'test.js',
  'lib/baileys.js',
  'lib/converter.js',
  'lib/functions.js',
  'lib/print.js',
  'lib/simple.js'
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

// Auto Event Handler (updated with EPIC coin event)
async function handleAutoEvent(message) {
  if (!message.author.id === '555955826880413696') return;

  let isAutoCatchEvent = false;

  if (message.embeds && message.embeds.length > 0) {
    for (const embed of message.embeds) {
      if (embed.fields && embed.fields.length > 0) {
        for (const field of embed.fields) {

          // EPIC COIN EVENT (NEW)
          if (field.name && field.name.includes(":EPICcoin: OOPS! God accidentally dropped an EPIC coin") &&
              field.value && field.value.includes("I wonder who will be the lucky player to get it??")) {
            isAutoCatchEvent = true;
            console.log('🪙 EPIC COIN EVENT DETECTED! Auto-catching...');

            setTimeout(async () => {
              try {
                if (message.components && message.components.length > 0) {
                  let buttonCustomId = null;
                  for (const row of message.components) {
                    if (row.components) {
                      for (const comp of row.components) {
                        if (comp.customId && comp.customId.includes('coin')) {
                          buttonCustomId = comp.customId;
                          break;
                        }
                      }
                      if (buttonCustomId) break;
                    }
                  }

                  if (buttonCustomId) {
                    await message.clickButton(buttonCustomId);
                    console.log('✅ Auto-EPIC COIN button clicked successfully');
                  } else {
                    console.log('❌ No EPIC COIN button found');
                  }
                } else {
                  console.log('❌ No components found for EPIC COIN');
                }
              } catch (error) {
                console.error('❌ EPIC COIN auto-catch failed:', error.message);
              }
            }, 1000 + Math.random() * 2000);
            break;
          }

          // LURE Event Detection
          if (field.name && field.name.includes(":fishing_pole_and_fish: **A LURE** has appeared") &&
              field.value && field.value.includes("Who will catch this legendary fish??")) {
            isAutoCatchEvent = true;
            console.log('🎣 LURE EVENT DETECTED! Auto-catching...');

            setTimeout(async () => {
              try {
                if (message.components && message.components.length > 0) {
                  let buttonCustomId = null;
                  for (const row of message.components) {
                    if (row.components) {
                      for (const comp of row.components) {
                        if (comp.customId && (comp.customId.includes('fish') || 
                          comp.customId?.includes('lure') ||
                          comp.customId?.includes('megalodon'))) {
                          buttonCustomId = comp.customId;
                          break;
                        }
                      }
                      if (buttonCustomId) break;
                    }
                  }

                  if (buttonCustomId) {
                    await message.clickButton(buttonCustomId);
                    console.log('✅ Auto-LURE button clicked successfully');
                  } else {
                    await message.channel.send('LURE');
                    console.log('✅ Auto-LURE typed successfully (no button found)');
                  }
                } else {
                  await message.channel.send('LURE');
                  console.log('✅ Auto-LURE typed successfully');
                }
              } catch (error) {
                console.error('❌ LURE failed:', error.message);
                try {
                  await message.channel.send('LURE');
                  console.log('✅ Auto-LURE typed successfully (fallback)');
                } catch (typeError) {
                  console.error('❌ Failed to auto-LURE:', typeError);
                }
              }
            }, 1000 + Math.random() * 2000);
            break;
          }

          // Coinflip Event Detection
          if (field.name && field.name.includes(":coin: **COINFLIP** started") &&
              field.value && field.value.includes("Wanna join? The fee is")) {
            isAutoCatchEvent = true;
            console.log('🪙 COINFLIP EVENT DETECTED! Auto-joining...');

            setTimeout(async () => {
              try {
                if (message.components && message.components.length > 0) {
                  let buttonCustomId = null;
                  for (const row of message.components) {
                    if (row.components) {
                      for (const comp of row.components) {
                        if (comp.customId && comp.customId.includes('coinflip')) {
                          buttonCustomId = comp.customId;
                          break;
                        }
                      }
                      if (buttonCustomId) break;
                    }
                  }

                  if (buttonCustomId) {
                    await message.clickButton(buttonCustomId);
                    console.log('✅ Auto-COINFLIP button clicked successfully');
                  } else {
                    await message.channel.send('COINFLIP');
                    console.log('✅ Auto-COINFLIP typed successfully (no button found)');
                  }
                } else {
                  await message.channel.send('COINFLIP');
                  console.log('✅ Auto-COINFLIP typed successfully');
                }
              } catch (error) {
                console.error('❌ COINFLIP failed:', error.message);
                try {
                  await message.channel.send('COINFLIP');
                  console.log('✅ Auto-COINFLIP typed successfully (fallback)');
                } catch (typeError) {
                  console.error('❌ Failed to auto-COINFLIP:', typeError);
                }
              }
            }, 1000 + Math.random() * 2000);
            break;
          }
        }
        if (isAutoCatchEvent) break;
      }
    }
  }
}

client.on('ready', async () => {
  console.log(`🔗 Logged in as: ${client.user.username}`);
  console.log('Selfbot ready!');
  console.log('RPC will auto-start and auto-events are enabled!');

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
  // Process auto-events regardless of the channel
  if (message.author.id === '555955826880413696') {
    await handleAutoEvent(message);
    return;
  }

  if (message.author.id !== client.user.id) return;

  const content = message.content.toLowerCase().trim();

  // Handle RPC commands (keep for manual control if needed)
  if (content === '.on rpc') {
    await message.delete().catch(() => {});
    currentChannel = message.channel;
    startRPC();
  } else if (content === '.off rpc') {
    await message.delete().catch(() => {});
    currentChannel = message.channel;
    stopRPC();
  }
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