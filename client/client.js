const socket = io();
let pc;
let stream;
let roomId = 'default-room'; // You can make this dynamic

const statusDiv = document.getElementById('status');
const joinButton = document.getElementById('join');
const leaveButton = document.getElementById('leave');

joinButton.addEventListener('click', joinRoom);
leaveButton.addEventListener('click', leaveRoom);

async function joinRoom() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        socket.emit('join', roomId);
        joinButton.disabled = true;
        leaveButton.disabled = false;
        updateStatus('Connecting...');

        socket.on('transportParameters', async ({ id, iceParameters, iceCandidates, dtlsParameters }) => {
            pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    // Add your TURN server configuration here
                ]
            });

            // Add local track
            const track = stream.getAudioTracks()[0];
            pc.addTrack(track, stream);

            // ICE handling
            pc.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    socket.emit('addIceCandidate', { candidate });
                }
            };

            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('transportConnect', {
                dtlsParameters: {
                    role: 'client',
                    fingerprints: dtlsParameters.fingerprints
                }
            });

            updateStatus('Connected');
        });

        socket.on('transportConnected', () => {
            console.log('Transport connected');
        });

        // Handle incoming audio
        pc.ontrack = (event) => {
            const audio = new Audio();
            audio.srcObject = event.streams[0];
            audio.play();
        };

    } catch (error) {
        console.error('Error joining room:', error);
        updateStatus('Error: ' + error.message);
    }
}

function leaveRoom() {
    if (pc) {
        pc.close();
        pc = null;
    }
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    socket.emit('leave', roomId);
    joinButton.disabled = false;
    leaveButton.disabled = true;
    updateStatus('Disconnected');
}

function updateStatus(message) {
    statusDiv.textContent = message;
    statusDiv.className = message === 'Connected' ? 'connected' : 'disconnected';
}

// Handle connection status
socket.on('connect', () => {
    console.log('Connected to server');
    updateStatus('Ready to join');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateStatus('Disconnected');
    leaveRoom();
});