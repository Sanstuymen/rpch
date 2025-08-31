# Discord RPC Client

A Discord Custom Rich Presence client

## Setup

1. Clone this repository
2. Install Bun:
   ```bash
   npm i -g bun
   ```

3. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file and replace `your_discord_token_here` with your actual Discord token:
   ```
   DISCORD_TOKEN=your_actual_discord_token_here
   ```

## Usage

Run the application:
```bash
bun rpc.js
```

**Note**: Make sure you have created the `.env` file with your Discord token before running the application.
