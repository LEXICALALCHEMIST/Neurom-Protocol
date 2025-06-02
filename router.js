import WebSocket, { WebSocketServer } from 'ws';
import sqlite3 from 'sqlite3';

// Initialize SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Failed to open SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database: users.db');
    // Drop the existing table and recreate with the correct schema
    db.serialize(() => {
      db.run(`DROP TABLE IF EXISTS users`, (err) => {
        if (err) console.error('Failed to drop users table:', err.message);
      });
      db.run(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          password TEXT NOT NULL,
          currentSKEL INTEGER NOT NULL,
          morphAddress TEXT NOT NULL
        )
      `, (err) => {
        if (err) console.error('Failed to create users table:', err.message);
      });
    });
  }
});

// Simulated Chronos interface (using SQLite)
const chronosInterface = {
  sendRegistrationInfo(userData) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (id, name, password, currentSKEL, morphAddress) VALUES (?, ?, ?, ?, ?)`,
        [userData.id, userData.name, userData.password, userData.currentSKEL, userData.morphAddress],
        (err) => {
          if (err) {
            console.error('Failed to store user in Chronos:', err.message, err);
            reject(err);
            return;
          }
          console.log('User stored in Chronos:', userData);
          resolve(true);
        }
      );
    });
  }
};

// Rest of the code remains unchanged
class Router {
  constructor() {
    this.nodeTable = new Map(); // Map<DID, { ip, port, ws }>
    this.wss = new WebSocketServer({ port: 8080 }); // Signaling server on port 8080
    this.setupSignalingServer();
    console.log('NEUROM Router Initialized on port 8080');
  }

  setupSignalingServer() {
    this.wss.on('connection', (ws, req) => {
      const ip = req.socket.remoteAddress;
      const port = req.socket.remotePort;
      console.log(`New device connected: ${ip}:${port}`);

      ws.on('message', async (message) => {
        let data;
        try {
          data = JSON.parse(message);
        } catch (error) {
          console.error('Invalid message format:', message);
          return;
        }

        switch (data.type) {
          case 'register':
            await this.handleRegister(data.did, ip, port, ws, data.userData).catch((err) => {
              ws.send(JSON.stringify({ type: 'error', message: `Failed to register with Chronos: ${err.message}` }));
            });
            break;
          case 'find':
            this.handleFind(ws, data.targetDid, data.transactionData);
            break;
          case 'signal':
            this.handleSignal(data.targetDid, data.signalData);
            break;
          case 'list-users':
            await this.listUsers(ws);
            break;
          default:
            console.error('Unknown message type:', data.type);
        }
      });

      ws.on('close', () => {
        // Remove device from node table on disconnect
        for (let [did, device] of this.nodeTable.entries()) {
          if (device.ws === ws) {
            this.nodeTable.delete(did);
            console.log(`Device disconnected: ${did}`);
            break;
          }
        }
      });
    });
  }

  // Register a device in the node table and send user data to Chronos
  async handleRegister(did, ip, port, ws, userData) {
    this.nodeTable.set(did, { ip, port, ws });
    console.log(`Device registered: ${did} at ${ip}:${port}`);

    // Send user data to Chronos
    await chronosInterface.sendRegistrationInfo(userData);
    ws.send(JSON.stringify({ type: 'registered', did }));
  }

  // Find a device by DID and send its network info to the requester
  handleFind(ws, targetDid, transactionData) {
    const target = this.nodeTable.get(targetDid);
    if (target) {
      ws.send(JSON.stringify({ 
        type: 'found', 
        did: targetDid, 
        ip: target.ip, 
        port: target.port,
        transactionData // Pass transaction data to the initiator
      }));
    } else {
      ws.send(JSON.stringify({ type: 'not-found', did: targetDid }));
    }
  }

  // Relay WebRTC signaling messages to the target device
  handleSignal(targetDid, signalData) {
    const target = this.nodeTable.get(targetDid);
    if (target && target.ws) {
      target.ws.send(JSON.stringify({ type: 'signal', signalData }));
      console.log(`Relayed signaling data to ${targetDid}`);
    } else {
      console.error(`Target device ${targetDid} not found for signaling`);
    }
  }

  // List all users stored in the database
  listUsers(ws) {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
      if (err) {
        console.error('Failed to query users:', err.message);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to query users' }));
        return;
      }
      console.log('Stored users:', rows);
      ws.send(JSON.stringify({ type: 'users', data: rows }));
    });
  }

  // Route a message from sender to target (used for non-WebRTC messages)
  routeMessage(senderDid, targetDid, message) {
    const target = this.nodeTable.get(targetDid);
    if (target && target.ws) {
      console.log(`Routing message from ${senderDid} to ${targetDid}:`, message);
      target.ws.send(JSON.stringify({ type: 'message', senderDid, message }));
    } else {
      console.error(`Target device ${targetDid} not found`);
    }
  }
}

export default new Router();