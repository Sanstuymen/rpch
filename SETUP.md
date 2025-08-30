# 🚀 Quick Setup Guide

## Prerequisites
- Node.js 16 or higher
- Discord account
- Telegram account

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Required Tokens

#### Discord Token:
1. Open Discord in your web browser
2. Press `F12` to open Developer Tools
3. Go to the **Network** tab
4. Send any message in Discord
5. Look for requests to `discord.com/api`
6. In the request headers, find the `Authorization` header
7. Copy the token (without the "Bearer " prefix)

#### Telegram Bot Token:
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the instructions
3. Choose a name and username for your bot
4. Copy the bot token provided

#### Your Telegram User ID:
1. Search for `@userinfobot` in Telegram
2. Send any message to get your User ID
3. Copy the numeric User ID

### 3. Configure Environment
```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file
nano .env
```

Add your tokens:
```env
DISCORD_TOKEN=your_discord_token_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
AUTHORIZED_USERS=your_telegram_user_id
WEB_PORT=3000
NODE_ENV=development
```

### 4. Start the Bot
```bash
# Start the Telegram bot
npm start

# Optional: Start the web dashboard
npm run web
```

### 5. Test the Bot
1. Open Telegram and find your bot
2. Send `/start` to begin
3. Use the interactive buttons to create and manage RPC configurations
4. Visit `http://localhost:3000` for the web dashboard

## Features Overview

### Telegram Bot Commands:
- **`/start`** - Main menu with buttons
- **`/create`** - Interactive RPC creation wizard
- **`/list`** - View and manage configurations
- **`/activate`** - Quick activation
- **`/stop`** - Stop current RPC
- **`/status`** - Check status

### Interactive Features:
- ✨ Step-by-step RPC creation
- 📋 Configuration management with buttons
- ▶️ One-click activation
- 🔄 Real-time status updates
- 🌐 Web dashboard monitoring

### RPC Configuration Options:
- **Name** - Configuration identifier
- **Details** - First line of RPC text
- **State** - Second line of RPC text
- **Images** - Large and small images (URLs or asset keys)
- **Buttons** - Up to 2 clickable buttons with URLs
- **Timestamp** - Show elapsed time

## Troubleshooting

### Bot not responding:
- Check if Telegram bot token is correct
- Verify your User ID is in AUTHORIZED_USERS
- Restart the bot

### RPC not showing on Discord:
- Ensure Discord is running and logged in
- Verify Discord token is valid
- Check application ID in configuration

### Web dashboard not loading:
- Check if port 3000 is available
- Try a different port in WEB_PORT environment variable
- Check console logs for errors

## Example RPC Configuration

```
Name: Gaming Session
Details: Playing Awesome Game  
State: Level 42 - Boss Battle
Application ID: 1380551344515055667
Large Image: https://example.com/game-logo.png
Small Image: https://example.com/character.png
Large Text: Game Logo
Small Text: My Character
Button 1: Join Server | https://discord.gg/invite
Button 2: View Stats | https://stats.example.com
Timestamp: Yes
```

## Security Notes
- Keep your tokens secure and private
- Never share your Discord token
- Only authorize trusted Telegram users
- This bot uses Discord self-bot functionality - use responsibly

## Need Help?
- Check the main README.md for detailed documentation
- Review error messages in the console
- Create an issue if you encounter problems

Happy RPC customization! 🎮