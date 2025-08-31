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
let farmEnabled = false;
let currentChannel = null;
let debugEnabled = false;

// Independent timer system untuk setiap command
let farmTimers = {
  adventure: null,
  axe: null,
  hunt: null,
  heal: null
};

let farmStates = {
  adventure: { enabled: false, executing: false },
  axe: { enabled: false, executing: false },
  hunt: { enabled: false, executing: false },
  heal: { enabled: false, executing: false }
};

// Default cooldowns (dalam ms) - removed heal cooldown
const DEFAULT_COOLDOWNS = {
  adventure: 3600000, // 1 hour
  axe: 300000,      // 5 minutes
  hunt: 60000        // 1 minute
  // heal removed - no cooldown, only HP-based
};

// RPC Functions (unchanged)
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

// Helper Functions
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
  const cooldownMatch = title.match(/wait at least \*{0,2}(\d+)m (\d+)s\*{0,2}/i);
  if (cooldownMatch) {
    const minutes = parseInt(cooldownMatch[1]);
    const seconds = parseInt(cooldownMatch[2]);
    const totalMs = (minutes * 60 + seconds) * 1000;

    // If cooldown is 0 seconds, add a small buffer (3 seconds)
    if (totalMs === 0) {
      return 3000;
    }

    return totalMs;
  }
  return null;
}

// Helper function to check cooldown from bot response
function checkForCooldown(botResponse) {
  if (botResponse.embeds && botResponse.embeds.length > 0) {
    for (const embed of botResponse.embeds) {
      if (embed.title && embed.title.includes('wait at least')) {
        const cooldownMs = parseCooldown(embed.title);
        if (cooldownMs > 0) {
          return cooldownMs;
        }
      }
    }
  }
  return 0;
}

// Helper function to check for EPIC GUARD and stop farm
function checkForEpicGuard(botResponse) {
  // Check in content
  if (botResponse.content && 
      (botResponse.content.includes('EPIC GUARD: stop there') || 
       botResponse.content.includes('We have to check you are actually playing'))) {
    return true;
  }
  
  // Check in embeds
  if (botResponse.embeds && botResponse.embeds.length > 0) {
    for (const embed of botResponse.embeds) {
      if (embed.title && 
          (embed.title.includes('EPIC GUARD') || 
           embed.title.includes('stop there') ||
           embed.title.includes('We have to check you are actually playing'))) {
        return true;
      }
      
      if (embed.description && 
          (embed.description.includes('EPIC GUARD') || 
           embed.description.includes('stop there') ||
           embed.description.includes('We have to check you are actually playing'))) {
        return true;
      }
      
      if (embed.fields && embed.fields.length > 0) {
        for (const field of embed.fields) {
          if ((field.name && 
               (field.name.includes('EPIC GUARD') || 
                field.name.includes('stop there') ||
                field.name.includes('We have to check you are actually playing'))) ||
              (field.value && 
               (field.value.includes('EPIC GUARD') || 
                field.value.includes('stop there') ||
                field.value.includes('We have to check you are actually playing')))) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

// Helper function to check HP and trigger heal if needed
async function checkAndHeal(botResponse) {
  if (!botResponse.content) return;
  
  const hpData = parseHP(botResponse.content);
  if (hpData) {
    const hpPercentage = (hpData.current / hpData.max) * 100;
    
    // More aggressive healing - heal at 60% HP or if HP < 60
    if (hpPercentage < 60 || hpData.current < 60) {
      console.log(`🩹 HP is low (${hpData.current}/${hpData.max} - ${Math.round(hpPercentage)}%), triggering heal...`);
      await triggerHeal();
      
      // Wait a bit after heal to ensure it processes
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log(`💚 HP is healthy (${hpData.current}/${hpData.max} - ${Math.round(hpPercentage)}%)`);
    }
  }
}

// Independent Adventure System
async function startAdventureTimer() {
  if (farmStates.adventure.enabled) return;
  
  farmStates.adventure.enabled = true;
  console.log('🗺️ Adventure timer started');
  
  // Execute immediately then start timer
  await executeAdventure();
  
  function scheduleAdventure() {
    if (!farmStates.adventure.enabled || !farmEnabled) return;
    
    farmTimers.adventure = setTimeout(async () => {
      await executeAdventure();
      scheduleAdventure();
    }, DEFAULT_COOLDOWNS.adventure);
  }
  
  scheduleAdventure();
}

async function executeAdventure() {
  if (farmStates.adventure.executing || !farmEnabled || !currentChannel) return;
  
  farmStates.adventure.executing = true;
  console.log('🗺️ Executing adventure...');
  
  try {
    const slashResponse = await currentChannel.sendSlash('555955826880413696', 'adventure');
    
    if (slashResponse) {
      try {
        const botResponse = await waitForBotResponse(slashResponse, '555955826880413696', 15000);
        
        // Check for EPIC GUARD first
        if (checkForEpicGuard(botResponse)) {
          console.log('🚨 EPIC GUARD DETECTED! Auto-stopping farm...');
          if (currentChannel) {
            currentChannel.send('🚨 **EPIC GUARD DETECTED!** 👮‍♂️ Auto-stopping farm for safety').catch(() => {});
          }
          stopFarm();
          farmStates.adventure.executing = false;
          return;
        }
        
        // Check for dynamic cooldown
        const cooldownMs = checkForCooldown(botResponse);
        if (cooldownMs > 0) {
          console.log(`⏰ Adventure cooldown detected: ${Math.ceil(cooldownMs/1000)}s`);
          // Reschedule with actual cooldown
          farmStates.adventure.enabled = false;
          if (farmTimers.adventure) clearTimeout(farmTimers.adventure);
          farmTimers.adventure = setTimeout(async () => {
            await executeAdventure();
            startAdventureTimer(); // Return to normal schedule
          }, cooldownMs + 2000);
          farmStates.adventure.executing = false;
          return;
        }
        
        // Check HP and trigger heal if needed
        await checkAndHeal(botResponse);
        console.log('✅ Adventure completed successfully');
        
      } catch (responseError) {
        console.log('⚠️ Adventure: No response received');
      }
    }
  } catch (error) {
    console.error('❌ Adventure execution failed:', error);
  } finally {
    farmStates.adventure.executing = false;
  }
}

function stopAdventureTimer() {
  farmStates.adventure.enabled = false;
  if (farmTimers.adventure) {
    clearTimeout(farmTimers.adventure);
    farmTimers.adventure = null;
  }
  console.log('🛑 Adventure timer stopped');
}

// Independent Axe System
async function startAxeTimer() {
  if (farmStates.axe.enabled) return;
  
  farmStates.axe.enabled = true;
  console.log('🪓 Axe timer started');
  
  // Execute immediately then start timer
  await executeAxe();
  
  function scheduleAxe() {
    if (!farmStates.axe.enabled || !farmEnabled) return;
    
    farmTimers.axe = setTimeout(async () => {
      await executeAxe();
      scheduleAxe();
    }, DEFAULT_COOLDOWNS.axe);
  }
  
  scheduleAxe();
}

async function executeAxe() {
  if (farmStates.axe.executing || !farmEnabled || !currentChannel) return;
  
  farmStates.axe.executing = true;
  console.log('🪓 Executing axe...');
  
  try {
    const slashResponse = await currentChannel.sendSlash('555955826880413696', 'axe');
    
    if (slashResponse) {
      try {
        const botResponse = await waitForBotResponse(slashResponse, '555955826880413696', 15000);
        
        // Check for EPIC GUARD first
        if (checkForEpicGuard(botResponse)) {
          console.log('🚨 EPIC GUARD DETECTED! Auto-stopping farm...');
          if (currentChannel) {
            currentChannel.send('🚨 **EPIC GUARD DETECTED!** 👮‍♂️ Auto-stopping farm for safety').catch(() => {});
          }
          stopFarm();
          farmStates.axe.executing = false;
          return;
        }
        
        // Check for dynamic cooldown
        const cooldownMs = checkForCooldown(botResponse);
        if (cooldownMs > 0) {
          console.log(`⏰ Axe cooldown detected: ${Math.ceil(cooldownMs/1000)}s`);
          // Reschedule with actual cooldown
          farmStates.axe.enabled = false;
          if (farmTimers.axe) clearTimeout(farmTimers.axe);
          farmTimers.axe = setTimeout(async () => {
            await executeaxe();
            startAxeTimer(); // Return to normal schedule
          }, cooldownMs + 2000);
          farmStates.axe.executing = false;
          return;
        }
        
        console.log('✅ Axe completed successfully');
        
      } catch (responseError) {
        console.log('⚠️ Axe: No response received');
      }
    }
  } catch (error) {
    console.error('❌ Axe execution failed:', error);
  } finally {
    farmStates.axe.executing = false;
  }
}

function stopAxeTimer() {
  farmStates.axe.enabled = false;
  if (farmTimers.axe) {
    clearTimeout(farmTimers.axe);
    farmTimers.axe = null;
  }
  console.log('🛑 Axe timer stopped');
}

// Independent Hunt System
async function startHuntTimer() {
  if (farmStates.hunt.enabled) return;
  
  farmStates.hunt.enabled = true;
  console.log('🏹 Hunt timer started');
  
  // Execute immediately then start timer
  await executeHunt();
  
  function scheduleHunt() {
    if (!farmStates.hunt.enabled || !farmEnabled) return;
    
    farmTimers.hunt = setTimeout(async () => {
      await executeHunt();
      scheduleHunt();
    }, DEFAULT_COOLDOWNS.hunt);
  }
  
  scheduleHunt();
}

async function executeHunt() {
  if (farmStates.hunt.executing || !farmEnabled || !currentChannel) return;
  
  farmStates.hunt.executing = true;
  console.log('🏹 Executing hunt...');
  
  try {
    const slashResponse = await currentChannel.sendSlash('555955826880413696', 'hunt');
    
    if (slashResponse) {
      try {
        const botResponse = await waitForBotResponse(slashResponse, '555955826880413696', 15000);
        
        // Check for EPIC GUARD first
        if (checkForEpicGuard(botResponse)) {
          console.log('🚨 EPIC GUARD DETECTED! Auto-stopping farm...');
          if (currentChannel) {
            currentChannel.send('🚨 **EPIC GUARD DETECTED!** 👮‍♂️ Auto-stopping farm for safety').catch(() => {});
          }
          stopFarm();
          farmStates.hunt.executing = false;
          return;
        }
        
        // Check for dynamic cooldown
        const cooldownMs = checkForCooldown(botResponse);
        if (cooldownMs > 0) {
          console.log(`⏰ Hunt cooldown detected: ${Math.ceil(cooldownMs/1000)}s`);
          // Reschedule with actual cooldown
          farmStates.hunt.enabled = false;
          if (farmTimers.hunt) clearTimeout(farmTimers.hunt);
          farmTimers.hunt = setTimeout(async () => {
            await executeHunt();
            startHuntTimer(); // Return to normal schedule
          }, cooldownMs + 2000);
          farmStates.hunt.executing = false;
          return;
        }
        
        // Check HP and trigger heal if needed
        await checkAndHeal(botResponse);
        console.log('✅ Hunt completed successfully');
        
      } catch (responseError) {
        console.log('⚠️ Hunt: No response received');
      }
    }
  } catch (error) {
    console.error('❌ Hunt execution failed:', error);
  } finally {
    farmStates.hunt.executing = false;
  }
}

function stopHuntTimer() {
  farmStates.hunt.enabled = false;
  if (farmTimers.hunt) {
    clearTimeout(farmTimers.hunt);
    farmTimers.hunt = null;
  }
  console.log('🛑 Hunt timer stopped');
}

// HP-based Heal System (no cooldown, only HP checking)
async function triggerHeal() {
  if (farmStates.heal.executing) {
    console.log('🩹 Heal already in progress, skipping...');
    return;
  }
  
  farmStates.heal.executing = true;
  console.log('🩹 Executing emergency heal...');
  
  try {
    const slashResponse = await currentChannel.sendSlash('555955826880413696', 'heal');
    
    if (slashResponse) {
      try {
        const botResponse = await waitForBotResponse(slashResponse, '555955826880413696', 15000);
        
        // Check for EPIC GUARD first
        if (checkForEpicGuard(botResponse)) {
          console.log('🚨 EPIC GUARD DETECTED! Auto-stopping farm...');
          if (currentChannel) {
            currentChannel.send('🚨 **EPIC GUARD DETECTED!** 👮‍♂️ Auto-stopping farm for safety').catch(() => {});
          }
          stopFarm();
          farmStates.heal.executing = false;
          return;
        }
        
        console.log('✅ Heal completed successfully');
        
        // Check if heal was successful by parsing response
        if (botResponse.content) {
          const healMatch = botResponse.content.match(/healed.*?(\d+).*?hp/i);
          if (healMatch) {
            console.log(`🩹 Healed ${healMatch[1]} HP successfully`);
          }
        }
        
      } catch (responseError) {
        console.log('⚠️ Heal: No response received');
      }
    }
  } catch (error) {
    console.error('❌ Heal execution failed:', error);
  } finally {
    // Always reset executing state immediately, no cooldown
    farmStates.heal.executing = false;
  }
}

// Updated main farm functions
async function startFarm(channel) {
  if (farmEnabled) return;

  farmEnabled = true;
  currentChannel = channel;
  console.log('🚜 Independent Auto Farm Started');
  if (currentChannel) {
    currentChannel.send('🚜 **Independent Auto Farm Started** - Each command runs on its own timer').catch(() => {});
  }

  // Initial heal before starting all timers
  await triggerHeal();
  
  // Wait 3 seconds after heal then start all timers
  setTimeout(() => {
    startAdventureTimer();
    startAxeTimer();
    startHuntTimer();
    console.log('✅ All farm timers are now running independently');
    console.log('🩹 Heal system: HP-based triggering (60% threshold)');
    console.log('🚨 EPIC GUARD detection: Auto-stop enabled');
  }, 3000);
}

function stopFarm() {
  if (!farmEnabled) return;

  farmEnabled = false;
  
  // Stop all individual timers
  stopAdventureTimer();
  stopAxeTimer();
  stopHuntTimer();
  
  // Reset heal state
  farmStates.heal.executing = false;

  console.log('🛑 Independent Auto Farm Stopped');
  if (currentChannel) {
    currentChannel.send('🛑 **Independent Auto Farm Stopped** - All timers cleared').catch(() => {});
  }
}

// Status command to check all timers
function getFarmStatus() {
  if (!farmEnabled) return '🛑 Farm is stopped';
  
  let status = '🚜 **Independent Farm Status:**\n';
  status += `🗺️ Adventure: ${farmStates.adventure.enabled ? (farmStates.adventure.executing ? 'Executing...' : 'Active') : 'Stopped'}\n`;
  status += `🪓 Axe: ${farmStates.axe.enabled ? (farmStates.axe.executing ? 'Executing...' : 'Active') : 'Stopped'}\n`;
  status += `🏹 Hunt: ${farmStates.hunt.enabled ? (farmStates.hunt.executing ? 'Executing...' : 'Active') : 'Stopped'}\n`;
  status += `🩹 Heal: ${farmStates.heal.executing ? 'Healing...' : 'Ready (HP-based trigger)'}\n`;
  status += `🚨 EPIC GUARD: Auto-stop protection enabled`;
  
  return status;
}

// Enhanced debug function for bot messages
async function debugBotMessage(message, targetMessage) {
  try {
    console.log('🔍 Starting debug of bot message...');
    
    // Debug message content
    if (targetMessage.content && targetMessage.content.trim()) {
      await message.channel.send(`**[DEBUG]** Bot Message Content:\n\`\`\`\n${targetMessage.content}\n\`\`\``).catch(() => {});
    }

    // Debug embeds
    if (targetMessage.embeds && targetMessage.embeds.length > 0) {
      await message.channel.send(`**[DEBUG]** Bot has ${targetMessage.embeds.length} embed(s)`).catch(() => {});

      for (let i = 0; i < targetMessage.embeds.length; i++) {
        const embed = targetMessage.embeds[i];
        let embedInfo = `**[DEBUG]** Embed ${i + 1}:\n`;

        if (embed.title) embedInfo += `**Title:** ${embed.title}\n`;
        if (embed.description) embedInfo += `**Description:** ${embed.description}\n`;
        if (embed.color) embedInfo += `**Color:** ${embed.color}\n`;
        if (embed.author) embedInfo += `**Author:** ${embed.author.name || 'N/A'}\n`;
        if (embed.footer) embedInfo += `**Footer:** ${embed.footer.text || 'N/A'}\n`;
        if (embed.timestamp) embedInfo += `**Timestamp:** ${embed.timestamp}\n`;

        if (embed.fields && embed.fields.length > 0) {
          embedInfo += `**Fields (${embed.fields.length}):**\n`;
          embed.fields.forEach((field, index) => {
            embedInfo += `  ${index + 1}. **${field.name}:** ${field.value}\n`;
          });
        }

        // Split long messages
        if (embedInfo.length > 1900) {
          const chunks = embedInfo.match(/.{1,1900}(\n|$)/g);
          for (const chunk of chunks) {
            await message.channel.send(chunk).catch(() => {});
          }
        } else {
          await message.channel.send(embedInfo).catch(() => {});
        }
      }
    }

    // Debug buttons/components
    if (targetMessage.components && targetMessage.components.length > 0) {
      await message.channel.send(`**[DEBUG]** Bot has ${targetMessage.components.length} component row(s) with buttons`).catch(() => {});
      
      for (let rowIndex = 0; rowIndex < targetMessage.components.length; rowIndex++) {
        const row = targetMessage.components[rowIndex];
        let buttonInfo = `**[DEBUG]** Button Row ${rowIndex + 1}:\n`;
        
        if (row.components && row.components.length > 0) {
          buttonInfo += `**Total Buttons:** ${row.components.length}\n`;
          
          row.components.forEach((component, btnIndex) => {
            buttonInfo += `**Button ${btnIndex + 1}:**\n`;
            buttonInfo += `  - Type: ${component.type || 'Unknown'}\n`;
            buttonInfo += `  - Style: ${component.style || 'Unknown'}\n`;
            buttonInfo += `  - Label: ${component.label || 'No Label'}\n`;
            buttonInfo += `  - Custom ID: ${component.customId || 'No Custom ID'}\n`;
            buttonInfo += `  - Disabled: ${component.disabled || false}\n`;
            if (component.emoji) {
              buttonInfo += `  - Emoji: ${component.emoji.name || component.emoji.id || 'Unknown emoji'}\n`;
            }
            if (component.url) {
              buttonInfo += `  - URL: ${component.url}\n`;
            }
            buttonInfo += `\n`;
          });
        }

        // Split long button info
        if (buttonInfo.length > 1900) {
          const chunks = buttonInfo.match(/.{1,1900}(\n|$)/g);
          for (const chunk of chunks) {
            await message.channel.send(chunk).catch(() => {});
          }
        } else {
          await message.channel.send(buttonInfo).catch(() => {});
        }
      }
    }

    // Debug message metadata
    let metadataInfo = `**[DEBUG]** Message Metadata:\n`;
    metadataInfo += `**Message ID:** ${targetMessage.id}\n`;
    metadataInfo += `**Author:** ${targetMessage.author.username} (${targetMessage.author.id})\n`;
    metadataInfo += `**Channel:** ${targetMessage.channel.name || targetMessage.channel.id}\n`;
    metadataInfo += `**Timestamp:** ${targetMessage.createdAt}\n`;
    metadataInfo += `**Has Content:** ${!!targetMessage.content}\n`;
    metadataInfo += `**Has Embeds:** ${!!(targetMessage.embeds && targetMessage.embeds.length > 0)}\n`;
    metadataInfo += `**Has Components:** ${!!(targetMessage.components && targetMessage.components.length > 0)}\n`;
    
    await message.channel.send(metadataInfo).catch(() => {});

    // If no content, embeds, or components
    if ((!targetMessage.content || !targetMessage.content.trim()) && 
        (!targetMessage.embeds || targetMessage.embeds.length === 0) &&
        (!targetMessage.components || targetMessage.components.length === 0)) {
      await message.channel.send(`**[DEBUG]** ⚠️ Bot message has no content, embeds, or components`).catch(() => {});
    }

    console.log('✅ Bot message debug completed');

  } catch (error) {
    console.error('❌ Error debugging bot message:', error);
    await message.channel.send(`**[DEBUG ERROR]** ${error.message}`).catch(() => {});
  }
}

// Enhanced message handler for debug commands
async function handleDebugCommand(message) {
  await message.delete().catch(() => {});
  
  // Check if this is a reply to another message
  if (message.reference && message.reference.messageId) {
    try {
      // Fetch the replied message
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
      
      // Check if the replied message is from EPIC RPG bot
      if (repliedMessage.author.id === '555955826880413696') {
        console.log('🔍 Debugging replied bot message...');
        await message.channel.send('🔍 **Debugging replied bot message...**').catch(() => {});
        await debugBotMessage(message, repliedMessage);
        return true;
      } else {
        await message.channel.send('❌ **Error:** You can only debug messages from EPIC RPG bot (ID: 555955826880413696)').catch(() => {});
        return true;
      }
    } catch (error) {
      await message.channel.send(`❌ **Error fetching replied message:** ${error.message}`).catch(() => {});
      return true;
    }
  }
  
  // If not a reply, check if it's a slash command debug
  const content = message.content.toLowerCase().trim();
  if (content.startsWith('.debug ')) {
    const command = content.substring(7).trim();
    
    if (!command) {
      await message.channel.send('❌ **Usage:** `.debug <command>` or reply to a bot message with `.debug`').catch(() => {});
      return true;
    }

    try {
      console.log(`🔍 Debug slash command: ${command}`);
      await message.channel.send(`🔍 **Executing debug command:** \`${command}\``).catch(() => {});
      
      const slashResponse = await message.channel.sendSlash('555955826880413696', command);

      if (slashResponse) {
        console.log('✅ Debug command sent successfully');

        // Wait for bot response
        try {
          console.log('⏳ Waiting for bot response...');
          const botResponse = await waitForBotResponse(slashResponse, '555955826880413696', 15000);
          
          await message.channel.send('✅ **Bot responded! Debugging response...**').catch(() => {});
          await debugBotMessage(message, botResponse);

        } catch (responseError) {
          await message.channel.send('**[DEBUG]** ⚠️ No bot response received within 15 seconds').catch(() => {});
        }
      } else {
        await message.channel.send('❌ **Failed to send slash command**').catch(() => {});
      }
    } catch (error) {
      await message.channel.send(`❌ **Debug command failed:** ${error.message}`).catch(() => {});
    }
    return true;
  }
  
  // If it's just ".debug" without parameters and not a reply
  if (content === '.debug') {
    await message.channel.send('ℹ️ **Debug Usage:**\n• `.debug <command>` - Debug a slash command\n• Reply to a bot message with `.debug` - Debug that message').catch(() => {});
    return true;
  }
  
  return false;
}

// Enhanced function to log debug information for bot messages (auto debug)
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

    // Send button/component info if exists
    if (message.components && message.components.length > 0) {
      await message.channel.send(`**[BOT EVENT]** Bot has ${message.components.length} component row(s) with buttons`);
      
      for (let rowIndex = 0; rowIndex < message.components.length; rowIndex++) {
        const row = message.components[rowIndex];
        let buttonInfo = `**[BOT EVENT]** Button Row ${rowIndex + 1}:\n`;
        
        if (row.components && row.components.length > 0) {
          buttonInfo += `**Total Buttons:** ${row.components.length}\n`;
          
          row.components.forEach((component, btnIndex) => {
            buttonInfo += `**Button ${btnIndex + 1}:**\n`;
            buttonInfo += `  - Label: ${component.label || 'No Label'}\n`;
            buttonInfo += `  - Custom ID: ${component.customId || 'No Custom ID'}\n`;
            buttonInfo += `  - Style: ${component.style || 'Unknown'}\n`;
            buttonInfo += `  - Disabled: ${component.disabled || false}\n`;
            if (component.emoji) {
              buttonInfo += `  - Emoji: ${component.emoji.name || component.emoji.id || 'Unknown emoji'}\n`;
            }
            buttonInfo += `\n`;
          });
        }

        // Split long button info if needed
        if (buttonInfo.length > 1900) {
          const chunks = buttonInfo.match(/.{1,1900}(\n|$)/g);
          for (const chunk of chunks) {
            await message.channel.send(chunk);
          }
        } else {
          await message.channel.send(buttonInfo);
        }
      }
    }

    // If no content, embeds, or components, still log it
    if ((!message.content || !message.content.trim()) && 
        (!message.embeds || message.embeds.length === 0) &&
        (!message.components || message.components.length === 0)) {
      await message.channel.send(`**[BOT EVENT]** Bot sent a message with no content/embeds/components`);
    }
  } catch (error) {
    console.error('Error sending bot event debug:', error);
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
                    for (const comp of row.components || []) {
                      if (comp.label && (comp.label.includes('CATCH') || comp.label.includes('GET'))) {
                        buttonCustomId = comp.customId;
                        break;
                      }
                      if (comp.customId && (comp.customId.includes('catch') || 
                          comp.customId.includes('coin') || 
                          comp.customId.includes('epic'))) {
                        buttonCustomId = comp.customId;
                        break;
                      }
                    }
                    if (buttonCustomId) break;
                  }

                  if (buttonCustomId) {
                    await message.clickButton(buttonCustomId);
                    console.log('✅ Auto-EPIC COIN button clicked successfully');
                  } else {
                    await message.channel.send('CATCH');
                    console.log('✅ Auto-EPIC COIN typed successfully (no button found)');
                  }
                } else {
                  await message.channel.send('CATCH');
                  console.log('✅ Auto-EPIC COIN typed successfully');
                }
              } catch (error) {
                console.error('❌ EPIC COIN failed:', error.message);
                try {
                  await message.channel.send('CATCH');
                  console.log('✅ Auto-EPIC COIN typed successfully (fallback)');
                } catch (typeError) {
                  console.error('❌ Failed to auto-EPIC COIN:', typeError);
                }
              }
            }, 1000);
            break;
          }

          // COIN RAIN EVENT
          if (field.name && field.name.includes("IT'S RAINING COINS") &&
              field.value && field.value.includes("Type **CATCH**")) {
            isAutoCatchEvent = true;
            console.log('🪙 COIN RAIN EVENT DETECTED! Auto-catching...');

            setTimeout(async () => {
              try {
                if (message.components && message.components.length > 0) {
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
              field.value && field.value.includes("Type **LURE**")) {
            isAutoCatchEvent = true;
            console.log('🦈 MEGALODON EVENT DETECTED! Auto-luring...');

            setTimeout(async () => {
              try {
                if (message.components && message.components.length > 0) {
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

          // ARENA EVENT
          if (field.name && field.name.includes("Type `join` to join the arena!") &&
              field.value && field.value.includes("arena cookies")) {
            isAutoCatchEvent = true;
            console.log('⚔️ ARENA EVENT DETECTED! Auto-joining...');

            setTimeout(async () => {
              try {
                if (message.components && message.components.length > 0) {
                  let buttonCustomId = null;
                  for (const row of message.components) {
                    for (const comp of row.components || []) {
                      if (comp.label === 'JOIN' ||
                          comp.customId?.includes('join') ||
                          comp.customId?.includes('arena')) {
                        buttonCustomId = comp.customId;
                        break;
                      }
                    }
                    if (buttonCustomId) break;
                  }

                  if (buttonCustomId) {
                    await message.clickButton(buttonCustomId);
                    console.log('✅ Auto-JOIN arena button clicked successfully');
                  } else {
                    await message.channel.send('JOIN');
                    console.log('✅ Auto-JOIN arena typed successfully (no button found)');
                  }
                } else {
                  await message.channel.send('JOIN');
                  console.log('✅ Auto-JOIN arena typed successfully');
                }
              } catch (error) {
                console.error('❌ JOIN arena failed:', error.message);
                try {
                  await message.channel.send('JOIN');
                  console.log('✅ Auto-JOIN arena typed successfully (fallback)');
                } catch (typeError) {
                  console.error('❌ Failed to auto-JOIN arena:', typeError);
                }
              }
            }, 1000);
            break;
          }

          // MINIBOSS EVENT
          if (field.name && field.name.includes("Type `fight` to help and get a reward!") &&
              field.value && field.value.includes("CHANCE TO WIN")) {
            isAutoCatchEvent = true;
            console.log('👹 MINIBOSS EVENT DETECTED! Auto-fighting...');

            setTimeout(async () => {
              try {
                if (message.components && message.components.length > 0) {
                  let buttonCustomId = null;
                  for (const row of message.components) {
                    for (const comp of row.components || []) {
                      if (comp.label === 'FIGHT' ||
                          comp.customId?.includes('fight') ||
                          comp.customId?.includes('miniboss')) {
                        buttonCustomId = comp.customId;
                        break;
                      }
                    }
                    if (buttonCustomId) break;
                  }

                  if (buttonCustomId) {
                    await message.clickButton(buttonCustomId);
                    console.log('✅ Auto-FIGHT miniboss button clicked successfully');
                  } else {
                    await message.channel.send('FIGHT');
                    console.log('✅ Auto-FIGHT miniboss typed successfully (no button found)');
                  }
                } else {
                  await message.channel.send('FIGHT');
                  console.log('✅ Auto-FIGHT miniboss typed successfully');
                }
              } catch (error) {
                console.error('❌ FIGHT miniboss failed:', error.message);
                try {
                  await message.channel.send('FIGHT');
                  console.log('✅ Auto-FIGHT miniboss typed successfully (fallback)');
                } catch (typeError) {
                  console.error('❌ Failed to auto-FIGHT miniboss:', typeError);
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

client.on('ready', async () => {
  console.log(`🔗 Logged in as: ${client.user.username}`);
  console.log('Selfbot ready!');
  console.log('Commands: .on rpc, .off rpc, .on farm, .off farm, .farm status, .debug <command>, .on debug, .off debug');
  console.log('Debug: Reply to bot messages with .debug to analyze them');

  extendURL = await Discord.RichPresence.getExternal(
    client,
    '1380551344515055667',
    'https://files.catbox.moe/nawqku.png',
  );
});

// Updated message handler
client.on('messageCreate', async (message) => {
  // Process auto-events regardless of the channel
  if (message.author.id === '555955826880413696') {
    await handleAutoEvent(message);
    await logBotDebugInfo(message);
    return;
  }

  if (message.author.id !== client.user.id) return;

  const content = message.content.toLowerCase().trim();

  // Handle debug commands (both reply and slash command)
  if (content === '.debug' || content.startsWith('.debug ')) {
    const handled = await handleDebugCommand(message);
    if (handled) return;
  }

  // Handle other commands
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
  } else if (content === '.farm status') {
    await message.delete().catch(() => {});
    const status = getFarmStatus();
    message.channel.send(status).catch(() => {});
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
  Object.values(farmTimers).forEach(timer => {
    if (timer) {
      clearTimeout(timer);
    }
  });
});

client.login(process.env.DISCORD_TOKEN);