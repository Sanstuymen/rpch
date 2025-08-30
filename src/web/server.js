import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rpcManager from '../rpc/manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WebServer {
  constructor() {
    this.app = express();
    this.port = process.env.WEB_PORT || 3000;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API Routes
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = rpcManager.getStatus();
        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        console.error('Error getting status:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    this.app.post('/api/rpc/stop', async (req, res) => {
      try {
        const result = await rpcManager.stopRPC();
        res.json(result);
      } catch (error) {
        console.error('Error stopping RPC:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Serve dashboard
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not found'
      });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(this.port, () => {
          console.log(`🌐 Web server running at http://localhost:${this.port}`);
          resolve(server);
        });
        
        server.on('error', (error) => {
          console.error('❌ Web server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Start server if run directly
if (process.argv.includes('--start') || process.env.NODE_ENV === 'production') {
  const webServer = new WebServer();
  webServer.start().catch(error => {
    console.error('❌ Failed to start web server:', error);
    process.exit(1);
  });
}

export default WebServer;