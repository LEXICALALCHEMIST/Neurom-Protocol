import WebSocket, { WebSocketServer } from 'ws';

// Simulated Chronos interface (stub for your GPU/database)
const chronosInterface = {
  sendRegistrationInfo(userData) {
    console.log('Sending registration info to Chronos:', userData);
    // TODO: Implement actual communication with Chronos (e.g., HTTP request, WebSocket)
    return true; // Simulated success
  }
};

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

      ws.on('message', (message) => {
        let data;
        try {
          data = JSON.parse(message);
        } catch (error) {
          console.error('Invalid message format:', message);
          return;
        }

        switch (data.type) {
          case 'register':
            this.handleRegister(data.did, ip, port, ws, data.userData);
            break;
          case 'find':
            this.handleFind(ws, data.targetDid);
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
  handleRegister(did, ip, port, ws, userData) {
    this.nodeTable.set(did, { ip, port, ws });
    console.log(`Device registered: ${did} at ${ip}:${port}`);

    // Send user data to Chronos
    const success = chronosInterface.sendRegistrationInfo(userData);
    if (success) {
      ws.send(JSON.stringify({ type: 'registered', did }));
    } else {
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to register with Chronos' }));
    }
  }

  // Find a device by DID and send its network info to the requester
  handleFind(ws, targetDid) {
    const target = this.nodeTable.get(targetDid);
    if (target) {
      ws.send(JSON.stringify({ type: 'found', did: targetDid, ip: target.ip, port: target.port }));
    } else {
      ws.send(JSON.stringify({ type: 'not-found', did: targetDid }));
    }
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