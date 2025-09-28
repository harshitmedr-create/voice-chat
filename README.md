# Voice Chat Application

A real-time voice chat application built with MediaSoup and Socket.IO.

## Features

- WebRTC-based voice communication
- Low-latency audio streaming
- Support for multiple rooms
- Simple and intuitive UI

## Prerequisites

- Node.js v16 or higher
- npm

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. Start the server:
   ```bash
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000`
3. Click "Join Room" to start voice chat
4. Allow microphone access when prompted

## Docker Deployment

To run using Docker:

```bash
docker build -t voice-chat .
docker run -p 3000:3000 voice-chat
```

## Configuration

- Edit the STUN/TURN server configuration in `client.js`
- Update the MediaSoup worker settings in `server.js`
- Modify the port in `server.js` (default: 3000)

## Troubleshooting

- If audio isn't working, check browser permissions
- Ensure your microphone is properly connected
- Check the browser console for any errors
- Verify TURN server configuration for NAT traversal

## Security Notes

- Replace the default STUN/TURN server configuration with your own servers
- Update the MediaSoup `listenIps` configuration with your server's IP
- Implement proper authentication before deployment