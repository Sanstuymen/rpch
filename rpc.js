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
let farmTimer;
let farmEnabled = false;
let currentChannel = null;
let debugEnabled = false;

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

async function startFarm(channel) {
  if (farmEnabled) return;

  farmEnabled = true;
  currentChannel = channel;
  console.log('🚜 Auto Farm Started');
  if (currentChannel) {
    currentChannel.send('🚜 **Auto Farm Started**').catch(() => {});
  }

  // Heal first before starting farm
  await performHeal();

  // Start farming immediately
  await performFarm();

  // Set interval for every 1 minute to check what to do
  farmTimer = setInterval(performFarm, 60000);
}

function stopFarm() {
  if (!farmEnabled) return;

  farmEnabled = false;
  if (farmTimer) {
    clearInterval(farmTimer);
    farmTimer = null;
  }

  console.log('🛑 Auto Farm Stopped');
  if (currentChannel) {
    currentChannel.send('🛑 **Auto Farm Stopped**').catch(() => {});
  }
}

async function waitForBotResponse(originalMessage, botId, timeout = 30000) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timeoutId = setTimeout(() => {
      if (!done) {
        done = true;
        client.off('messageCreate', onMessage);
        client.off('messageUpdate', onUpdate);
        reject(new Error('Timeout waiting for bot response'));
      }
    }, timeout);

    function onMessage(message) {
      if (message.author.id === botId && message.channel.id === originalMessage.channel.id) {
        if (!done) {
          done = true;
          clearTimeout(timeoutId);
          client.off('messageCreate', onMessage);
          client.off('messageUpdate', onUpdate);
          resolve(message);
        }
      }
    }

    function onUpdate(oldMsg, newMsg) {
      if (newMsg.author.id === botId && newMsg.channel.id === originalMessage.channel.id) {
        if (!done) {
          done = true;
          clearTimeout(timeoutId);
          client.off('messageCreate', onMessage);
          client.off('messageUpdate', onUpdate);
          resolve(newMsg);
        }
      }
    }

    client.on('messageCreate', onMessage);
    client.on('messageUpdate', onUpdate);
  });
}

async function performHeal() {
  if (!currentChannel) return;

  try {
    const slashResponse = await currentChannel.sendSlash('555955826880413696', 'heal');

    if (slashResponse) {
      try {
        const botResponse = await waitForBotResponse(slashResponse, '555955826880413696', 15000);
      } catch (responseError) {
        // Silent fail for heal response
      }
    }
  } catch (error) {
    console.error('❌ Failed to heal:', error);
  }
}

function parseHP(content) {
  // Parse HP from content like "Lost 32 HP, remaining HP is 41/105"
  const hpMatch = content.match(/remaining HP is (\d+)\/(\d+)/i);
  if (hpMatch) {
    return {
      current: parseInt(hpMatch[1]),
      max: parseInt(hpMatch[2])
    };
  }
  return null;
}

function parseCooldown(title) {
  // Parse cooldown from title like "You have already looked around, wait at least **0m 0s**..."
  // Handle both plain text and markdown formatting
  const cooldownMatch = title.match(/wait at least \*{0,2}(\d+)m (\d+)s\*{0,2}/i);
  if (cooldownMatch) {
    const minutes = parseInt(cooldownMatch[1]);
    const seconds = parseInt(cooldownMatch[2]);
    const totalMs = (minutes * 60 + seconds) * 1000;

    // If cooldown is 0 seconds, add a small buffer (3-5 seconds)
    if (totalMs === 0) {
      return 3000; // 3 seconds buffer for "0m 0s" cases
    }

    return totalMs; // Convert to milliseconds
  }
  return null;
}

let lastAdventureTime = 0;
let lastChopTime = 0;

async function performFarm() {
  if (!farmEnabled || !currentChannel) return;

  const currentTime = Date.now();

  // Check if we should do adventure (1 hour = 3600000ms)
  if (currentTime - lastAdventureTime >= 3600000) {
    await performAdventure();
    lastAdventureTime = currentTime;
  } else if (currentTime - lastChopTime >= 300000) { // 5 minutes = 300000ms
    await performChop();
    lastChopTime = currentTime;
  } else {
    // Do hunt
    await performHunt();
  }
}

async function performAdventure() {
  if (!farmEnabled || !currentChannel) return;

  try {
    console.log('🗺️ Performing adventure...');
    const slashResponse = await currentChannel.sendSlash('555955826880413696', 'adventure');

    if (slashResponse) {
      try {
        const botResponse = await waitForBotResponse(slashResponse, '555955826880413696', 15000);

        if (botResponse.content) {
          const hpData = parseHP(botResponse.content);
          if (hpData && hpData.current < 50) {
            console.log(`🩹 HP is low (${hpData.current}/${hpData.max}), triggering auto heal...`);
            await performHeal();
          }
        }

        // Check for cooldown in embeds
        let isCooldown = false;
        let retryDelay = 0;

        if (botResponse.embeds && botResponse.embeds.length > 0) {
          for (const embed of botResponse.embeds) {
            if (embed.title && embed.title.includes('wait at least')) {
              isCooldown = true;
              const cooldownMs = parseCooldown(embed.title);
              if (cooldownMs) {
                retryDelay = cooldownMs + 2000; // Add 2 second buffer
                console.log(`⏰ Adventure on cooldown, retrying in ${Math.ceil(retryDelay/1000)} seconds...`);
              }
              break;
            }
          }
        }

        if (isCooldown && retryDelay > 0) {
          setTimeout(() => {
            if (farmEnabled) {
              console.log('🔄 Retrying adventure after cooldown...');
              performAdventure();
            }
          }, retryDelay);
        }

      } catch (responseError) {
        console.log('⚠️ No adventure response received');
      }
    }
  } catch (error) {
    console.error('❌ Failed to perform adventure:', error);
  }
}

async function performChop() {
  if (!farmEnabled || !currentChannel) return;

  try {
    console.log('🪓 Performing chop...');
    const slashResponse = await currentChannel.sendSlash('555955826880413696', 'chop');

    if (slashResponse) {
      try {
        const botResponse = await waitForBotResponse(slashResponse, '555955826880413696', 15000);

        // Check for cooldown in embeds
        let isCooldown = false;
        let retryDelay = 0;

        if (botResponse.embeds && botResponse.embeds.length > 0) {
          for (const embed of botResponse.embeds) {
            if (embed.title && embed.title.includes('wait at least')) {
              isCooldown = true;
              const cooldownMs = parseCooldown(embed.title);
              if (cooldownMs) {
                retryDelay = cooldownMs + 2000; // Add 2 second buffer
                console.log(`⏰ Chop on cooldown, retrying in ${Math.ceil(retryDelay/1000)} seconds...`);
              }
              break;
            }
          }
        }

        if (isCooldown && retryDelay > 0) {
          setTimeout(() => {
            if (farmEnabled) {
              console.log('🔄 Retrying chop after cooldown...');
              performChop();
            }
          }, retryDelay);
        }

      } catch (responseError) {
        console.log('⚠️ No chop response received');
      }
    }
  } catch (error) {
    console.error('❌ Failed to perform chop:', error);
  }
}

async function performHunt() {
  if (!farmEnabled || !currentChannel) return;

  try {
    console.log('🏹 Performing hunt...'); // Added log for hunt
    const slashResponse = await currentChannel.sendSlash('555955826880413696', 'hunt');

    if (slashResponse) {
      try {
        const botResponse = await waitForBotResponse(slashResponse, '555955826880413696', 15000);

        if (botResponse.content) {
          const hpData = parseHP(botResponse.content);
          if (hpData && hpData.current < 50) {
            console.log(`🩹 HP is low (${hpData.current}/${hpData.max}), triggering auto heal...`);
            await performHeal();
          }
        }

        // Check for cooldown in embeds
        let isCooldown = false;
        let retryDelay = 0;

        if (botResponse.embeds && botResponse.embeds.length > 0) {
          for (const embed of botResponse.embeds) {
            if (embed.title && embed.title.includes('wait at least')) {
              isCooldown = true;
              const cooldownMs = parseCooldown(embed.title);
              if (cooldownMs) {
                retryDelay = cooldownMs + 2000;
              }
              break;
            }
          }
        }

        if (isCooldown && retryDelay > 0) {
          setTimeout(() => {
            if (farmEnabled) {
              console.log('🔄 Retrying hunt after cooldown...');
              performHunt();
            }
          }, retryDelay);
        } else if (!isCooldown) {
          // No cooldown detected, use default cooldown (1 minute for hunt)
          setTimeout(() => {
            if (farmEnabled) {
              console.log('🔄 Retrying hunt after default cooldown (1 minute)...');
              performHunt();
            }
          }, 60000); // 1 minute default cooldown
        }

      } catch (responseError) {
        console.log('⚠️ No hunt response received');
      }
    }
  } catch (error) {
    console.error('❌ Failed to perform hunt:', error);
  }
}

client.on('ready', async () => {
  console.log(`🔗 Logged in as: ${client.user.username}`);
  console.log('Selfbot ready!');
  console.log('Commands: .on rpc, .off rpc, .on farm, .off farm, .debug <command>, .on debug, .off debug');

  extendURL = await Discord.RichPresence.getExternal(
    client,
    '1380551344515055667',
    'https://files.catbox.moe/nawqku.png',
  );
});

// Optimized auto-event handling - replace your handleAutoEvent function with this:

async function handleAutoEvent(message) {
  if (!message.author.id === '555955826880413696') return;

  let isAutoCatchEvent = false;

  if (message.embeds && message.embeds.length > 0) {
    for (const embed of message.embeds) {
      if (embed.fields && embed.fields.length > 0) {
        for (const field of embed.fields) {

          // COIN RAIN EVENT
          if (field.name && field.name.includes("IT'S RAINING COINS") &&
              field.value && field.value.includes("Type **CATCH**")) {
            isAutoCatchEvent = true;
            console.log('🪙 COIN RAIN EVENT DETECTED! Auto-catching...');

            setTimeout(async () => {
              try {
                if (message.components && message.components.length > 0) {
                  // Find the button with CATCH label or coin-related customId
                  let buttonCustomId = null;
                  for (const row of message.components) {
                    for (const comp of row.components || []) {
                      if (comp.label === 'CATCH' ||
                          comp.customId?.includes('catch') ||
                          comp.customId?.includes('coin')) {
                        buttonCustomId = comp.customId;
                        break;
                      }
                    }
                    if (buttonCustomId) break;
                  }

                  if (buttonCustomId) {
                    await message.clickButton(buttonCustomId);
                    console.log('✅ Auto-CATCH button clicked successfully');
                  } else {
                    await message.channel.send('CATCH');
                    console.log('✅ Auto-CATCH typed successfully (no button found)');
                  }
                } else {
                  await message.channel.send('CATCH');
                  console.log('✅ Auto-CATCH typed successfully');
                }
              } catch (error) {
                console.error('❌ CATCH failed:', error.message);
                try {
                  await message.channel.send('CATCH');
                  console.log('✅ Auto-CATCH typed successfully (fallback)');
                } catch (typeError) {
                  console.error('❌ Failed to auto-CATCH:', typeError);
                }
              }
            }, 1000);
            break;
          }

          // EPIC TREE EVENT
          if (field.name && field.name.includes("AN EPIC TREE HAS JUST GROWN") &&
              field.value && field.value.includes("Type **CUT**")) {
            isAutoCatchEvent = true;
            console.log('🌳 EPIC TREE EVENT DETECTED! Auto-cutting...');

            setTimeout(async () => {
              try {
                if (message.components && message.components.length > 0) {
                  // Use the working method - customId only
                  await message.clickButton('epictree_join');
                  console.log('✅ Auto-CUT button clicked successfully');
                } else {
                  await message.channel.send('CUT');
                  console.log('✅ Auto-CUT typed successfully');
                }
              } catch (error) {
                console.error('❌ CUT button click failed:', error.message);
                try {
                  await message.channel.send('CUT');
                  console.log('✅ Auto-CUT typed successfully (fallback)');
                } catch (typeError) {
                  console.error('❌ Failed to auto-CUT:', typeError);
                }
              }
            }, 1000);
            break;
          }

          // MEGALODON EVENT
          if (field.name && field.name.includes("A MEGALODON HAS SPAWNED") &&
              field.value && field.value.includes("Type LURE")) {
            isAutoCatchEvent = true;
            console.log('🦈 MEGALODON EVENT DETECTED! Auto-luring...');

            setTimeout(async () => {
              try {
                if (message.components && message.components.length > 0) {
                  // Find the button with LURE label or megalodon-related customId
                  let buttonCustomId = null;
                  for (const row of message.components) {
                    for (const comp of row.components || []) {
                      if (comp.label === 'LURE' ||
                          comp.customId?.includes('lure') ||
                          comp.customId?.includes('megalodon')) {
                        buttonCustomId = comp.customId;
                        break;
                      }
                    }
                    if (buttonCustomId) break;
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
            }, 1000);
            break;
          }
        }
        if (isAutoCatchEvent) break;
      }
    }
  }
}

// Function to log debug information for bot messages
async function logBotDebugInfo(message) {
  if (!debugEnabled) return;

  try {
    // Send content if exists
    if (message.content && message.content.trim()) {
      await message.channel.send(`**[BOT EVENT]** Bot Message:\n\`\`\`\n${message.content}\n\`\`\``);
    }

    // Send embed info if exists
    if (message.embeds && message.embeds.length > 0) {
      await message.channel.send(`**[BOT EVENT]** Bot has ${message.embeds.length} embed(s)`);

      // Display each embed's content
      for (let i = 0; i < message.embeds.length; i++) {
        const embed = message.embeds[i];
        let embedInfo = `**[BOT EVENT]** Embed ${i + 1}:\n`;

        if (embed.title) embedInfo += `**Title:** ${embed.title}\n`;
        if (embed.description) embedInfo += `**Description:** ${embed.description}\n`;
        if (embed.color) embedInfo += `**Color:** ${embed.color}\n`;
        if (embed.author) embedInfo += `**Author:** ${embed.author.name || 'N/A'}\n`;
        if (embed.footer) embedInfo += `**Footer:** ${embed.footer.text || 'N/A'}\n`;
        if (embed.timestamp) embedInfo += `**Timestamp:** ${embed.timestamp}\n`;

        if (embed.fields && embed.fields.length > 0) {
          embedInfo += `**Fields:**\n`;
          embed.fields.forEach((field, index) => {
            embedInfo += `  ${index + 1}. **${field.name}:** ${field.value}\n`;
          });
        }

        // Check if message is too long and split if needed
        if (embedInfo.length > 1900) {
          const chunks = embedInfo.match(/.{1,1900}(\n|$)/g);
          for (const chunk of chunks) {
            await message.channel.send(chunk);
          }
        } else {
          await message.channel.send(embedInfo);
        }
      }
    }

    // If no content and no embeds, still log it
    if ((!message.content || !message.content.trim()) && (!message.embeds || message.embeds.length === 0)) {
      await message.channel.send(`**[BOT EVENT]** Bot sent a message with no content/embeds`);
    }
  } catch (error) {
    console.error('Error sending bot event debug:', error);
  }
}

client.on('messageCreate', async (message) => {
  // Process auto-events regardless of the channel
  if (message.author.id === '555955826880413696') {
    await handleAutoEvent(message);
    await logBotDebugInfo(message); // Log debug info separately
    return; // Don't process bot messages as user commands
  }

  if (message.author.id !== client.user.id) return;

  const content = message.content.toLowerCase().trim();

  if (content === '.on rpc') {
    await message.delete().catch(() => {});
    currentChannel = message.channel;
    startRPC();
  } else if (content === '.off rpc') {
    await message.delete().catch(() => {});
    currentChannel = message.channel;
    stopRPC();
  } else if (content === '.on farm') {
    await message.delete().catch(() => {});
    await startFarm(message.channel);
  } else if (content === '.off farm') {
    await message.delete().catch(() => {});
    currentChannel = message.channel;
    stopFarm();
  } else if (content === '.on debug') {
    await message.delete().catch(() => {});
    currentChannel = message.channel;
    debugEnabled = true;
    console.log('🐛 Debug Enabled');
    currentChannel.send('🐛 **Debug Enabled** - Bot events will be shown').catch(() => {});
  } else if (content === '.off debug') {
    await message.delete().catch(() => {});
    currentChannel = message.channel;
    debugEnabled = false;
    console.log('🚫 Debug Disabled');
    currentChannel.send('🚫 **Debug Disabled** - Bot events will be hidden').catch(() => {});
  } else if (content.startsWith('.debug ')) {
    await message.delete().catch(() => {});
    const command = content.substring(7).trim();

    try {
      console.log(`🔍 Debug command: ${command}`);
      const slashResponse = await message.channel.sendSlash('555955826880413696', command);

      if (slashResponse) {
        console.log('✅ Debug command sent successfully');

        // Wait for bot response
        try {
          console.log('⏳ Waiting for bot response...');
          const botResponse = await waitForBotResponse(slashResponse, '555955826880413696', 15000);

          // Send the bot response for debugging
          if (botResponse.content) {
            await message.channel.send(`**[DEBUG]** Bot Response:\n\`\`\`\n${botResponse.content}\n\`\`\``).catch(() => {});
          }

          if (botResponse.embeds && botResponse.embeds.length > 0) {
            await message.channel.send(`**[DEBUG]** Bot has ${botResponse.embeds.length} embed(s)`).catch(() => {});

            // Display embed content
            for (let i = 0; i < botResponse.embeds.length; i++) {
              const embed = botResponse.embeds[i];
              let embedInfo = `**[DEBUG]** Embed ${i + 1}:\n`;

              if (embed.title) embedInfo += `**Title:** ${embed.title}\n`;
              if (embed.description) embedInfo += `**Description:** ${embed.description}\n`;
              if (embed.color) embedInfo += `**Color:** ${embed.color}\n`;
              if (embed.fields && embed.fields.length > 0) {
                embedInfo += `**Fields:**\n`;
                embed.fields.forEach((field, index) => {
                  embedInfo += `  ${index + 1}. **${field.name}:** ${field.value}\n`;
                });
              }

              await message.channel.send(embedInfo).catch(() => {});
            }
          }

        } catch (responseError) {
          await message.channel.send('**[DEBUG]** No bot response received within 15 seconds').catch(() => {});
        }
      }
    } catch (error) {
      await message.channel.send(`❌ **Debug command failed:** ${error.message}`).catch(() => {});
    }
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
  if (farmTimer) {
    clearInterval(farmTimer);
  }
});

client.login(process.env.DISCORD_TOKEN);