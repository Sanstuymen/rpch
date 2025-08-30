# 🤖 Telegram RPC Bot

A powerful Telegram bot for creating and managing custom Discord Rich Presence (RPC) configurations with interactive buttons and a web dashboard.

## ✨ Features

### 🎮 Discord Rich Presence Management
- **Custom RPC Configurations**: Create unlimited RPC profiles with custom details, state, images, and buttons
- **Interactive Creation**: Step-by-step RPC creation process with validation and previews  
- **Multiple Configurations**: Store and manage multiple RPC setups for different activities
- **Real-time Activation**: Instantly activate/deactivate RPC configurations
- **Status Monitoring**: Track uptime, active configuration, and connection status

### 🚀 Telegram Bot Interface
- **Interactive Buttons**: Full button-based navigation for easy use
- **Smart Commands**: Comprehensive command system with `/start`, `/create`, `/list`, `/activate`, `/stop`, `/status`
- **User Authorization**: Whitelist-based user access control
- **Real-time Feedback**: Live status updates and error handling
- **Multi-step Wizards**: Guided configuration creation with validation

### 🌐 Web Dashboard (Optional)
- **Real-time Monitoring**: Live status dashboard with auto-refresh
- **Remote Control**: Stop RPC configurations from the web interface
- **Statistics**: View usage statistics and configuration counts
- **Modern UI**: Beautiful responsive design with animations

### 🔧 Advanced Features
- **Configuration Validation**: Comprehensive input validation for Discord RPC compliance
- **Error Recovery**: Intelligent error handling and user guidance
- **Data Persistence**: JSON-based storage with backup capabilities
- **External Images**: Support for external image URLs with automatic processing
- **Button Support**: Up to 2 custom buttons per RPC configuration
- **Timestamp Options**: Optional elapsed time display

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Discord account with token
- Telegram Bot Token (from @BotFather)

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/telegram-rpc-bot.git
cd telegram-rpc-bot

# Install dependencies
npm install
```

### 2. Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your tokens
nano .env
```

Required environment variables:
```env
# Discord Bot Token (your Discord account token)
DISCORD_TOKEN=your_discord_token_here

# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Authorized Telegram User IDs (comma-separated)
AUTHORIZED_USERS=your_telegram_user_id

# Optional: Web dashboard port
WEB_PORT=3000
```

### 3. Getting Required Tokens

#### Discord Token:
1. Open Discord in your browser
2. Press F12 to open Developer Tools  
3. Go to Network tab
4. Send any message in a channel
5. Look for requests to `discord.com/api`
6. In Headers, find `Authorization` header
7. Copy the token (without "Bearer " prefix)

#### Telegram Bot Token:
1. Message @BotFather on Telegram
2. Send `/newbot` and follow instructions
3. Copy the token provided

#### Your Telegram User ID:
1. Message @userinfobot on Telegram
2. Copy your User ID number

### 4. Running the Bot

#### Start Telegram Bot:
```bash
npm start
```

#### Start Web Dashboard (Optional):
```bash
npm run web
```

#### Development Mode:
```bash
npm run dev
```

## 📱 How to Use

### Basic Commands
- **`/start`** - Show main menu with interactive buttons
- **`/create`** - Create new RPC configuration (step-by-step wizard)
- **`/list`** - View and manage your RPC configurations  
- **`/activate`** - Quick activate any configuration
- **`/stop`** - Stop current RPC activity
- **`/status`** - Check bot and RPC status
- **`/help`** - View help information

### Creating Your First RPC

1. Send `/start` to the bot
2. Click "✨ Create RPC" button
3. Follow the interactive wizard:
   - **Name**: Configuration name (required)
   - **Details**: First line of RPC text
   - **State**: Second line of RPC text  
   - **App ID**: Discord Application ID (optional)
   - **Images**: Large and small image URLs
   - **Buttons**: Up to 2 custom buttons with URLs
   - **Timestamp**: Show elapsed time (yes/no)

4. Review and confirm your configuration
5. Activate it instantly or save for later

### Managing Configurations

- **View All**: Use `/list` or "📋 My RPCs" button
- **Edit**: Select any configuration and click "✏️ Edit"
- **Delete**: Click "🗑️ Delete" and confirm
- **Activate**: Click "▶️ Activate" for instant activation

## 🔧 Configuration Examples

### Gaming RPC
```
Name: Gaming Session
Details: Playing Awesome Game
State: Level 42 - Boss Fight
Large Image: https://example.com/game-logo.png
Button 1: Join Server | https://discord.gg/invite
Button 2: View Stats | https://stats.example.com
```

### Coding RPC
```
Name: Development Work  
Details: Coding in JavaScript
State: Building Telegram Bot
Large Image: https://example.com/vscode-icon.png
Small Image: https://example.com/js-logo.png
Button 1: GitHub | https://github.com/username/repo
```

### Music RPC
```
Name: Music Time
Details: Listening to Lo-fi
State: Chill Study Session
Large Image: https://example.com/music-cover.jpg
Timestamp: Yes
```

## 🌐 Web Dashboard

Access the web dashboard at `http://localhost:3000` to:

- **Monitor Status**: Real-time connection and RPC status
- **View Statistics**: Configuration counts and uptime
- **Remote Control**: Stop RPC configurations remotely
- **System Health**: Check bot and Discord connectivity

## 📁 Project Structure

```
telegram-rpc-bot/
├── src/
│   ├── bot/
│   │   ├── index.js          # Main Telegram bot
│   │   └── commands/         # Command handlers
│   │       ├── start.js      # Start and main menu
│   │       ├── create.js     # RPC creation wizard
│   │       ├── list.js       # Configuration listing
│   │       └── activate.js   # RPC activation
│   ├── rpc/
│   │   ├── client.js         # Discord RPC client
│   │   └── manager.js        # RPC configuration manager
│   ├── utils/
│   │   ├── constants.js      # Bot constants and keyboards
│   │   ├── helpers.js        # Utility functions
│   │   └── storage.js        # Data persistence
│   └── web/
│       ├── server.js         # Express web server
│       └── public/
│           └── index.html    # Dashboard interface
├── data/
│   └── configurations.json   # Stored configurations
├── package.json
├── .env.example
└── README.md
```

## 🛡️ Security Features

- **User Authorization**: Whitelist-based access control
- **Input Validation**: Comprehensive RPC field validation
- **Rate Limiting**: Prevents spam and abuse
- **Error Handling**: Graceful error recovery
- **Data Sanitization**: Safe input processing

## 🐛 Troubleshooting

### Common Issues

**"Failed to connect to Discord"**
- Verify your Discord token is correct
- Make sure Discord is running
- Check if token has expired

**"Bot not responding"**  
- Verify Telegram bot token
- Check if you're in the authorized users list
- Restart the bot

**"RPC not showing on Discord"**
- Verify Discord application ID
- Check if image URLs are accessible
- Ensure Discord is running and logged in

### Debug Mode
```bash
NODE_ENV=development npm start
```

### Logs
- Bot logs all user actions and errors to console
- Check console output for detailed error information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Telegraf](https://github.com/telegraf/telegraf) - Modern Telegram Bot API framework
- [discord.js-selfbot-v13](https://github.com/aiko-chan-ai/discord.js-selfbot-v13) - Discord self-bot library
- [Express](https://expressjs.com/) - Web framework for dashboard

## 💬 Support

- Create an issue for bug reports or feature requests
- Join our Discord server for community support
- Check the troubleshooting section above

---

**⚠️ Important**: This bot uses Discord self-bot functionality. Use responsibly and in accordance with Discord's Terms of Service. Self-bots are for personal use only.

Made with ❤️ for the community!
