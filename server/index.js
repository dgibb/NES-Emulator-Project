const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const path = require('path');

const { emulator } = require('../Emulator/emulator');
const { cpu, wRAM } = require('../Emulator/cpu');
const { input } = require('../Emulator/input');

const connections = [];

server.listen(process.env.PORT || 5000); // 5000 for heroku compatability

console.log('server running...');

app.post('/sendRom', (req, res) => {
  let valid = false;
  const rom = new Array(0);
  req.on('data', (data) => {
    const temp = new Uint8Array(data);
    console.log('Temp.length  = ', temp.length);
    for (let i = 0; i < temp.length; i += 1) {
      rom.push(temp[i]);
    }
  });
  req.on('end', () => {
    console.log('rom.length  = ', rom.length);
    valid = emulator.loadROM(rom);
    if (valid) {
      console.log('rom was valid, initializing emulator');
      emulator.init();
    }
    res.send(valid);
  });
});

app.post('/runFrame', () => {
  emulator.runFrame();
});

app.use(express.static(path.resolve(__dirname, '..', 'Client')));

app.get('/*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'Client', 'index.html'));
});

io.sockets.on('connection', (socket) => {
  console.log('socket conection...');
  if (connections.length < 2) {
    connections.push(socket);
    socket.player = connections.length;

    // tell the client which player it is
    socket.emit('player-designation', socket.player);

    // handle client keypress
    socket.on('keyUp', (keyCode) => {
      switch (keyCode) {
        case 65: input.shiftRegisters[socket.player][0] = 1; break; // A
        case 83: input.shiftRegisters[socket.player][1] = 1; break; // B
        case 38: input.shiftRegisters[socket.player][4] = 1; break; // up
        case 40: input.shiftRegisters[socket.player][5] = 1; break; // Down
        case 37: input.shiftRegisters[socket.player][6] = 1; break; // Left
        case 39: input.shiftRegisters[socket.player][7] = 1; break; // Right
        case 13: input.shiftRegisters[socket.player][3] = 1; break; // Start
        case 16: input.shiftRegisters[socket.player][2] = 1; break; // Select
        default:
      }
    });

    socket.on('keyUp', (keyCode) => {
      switch (keyCode) {
        case 65: input.shiftRegisters[socket.player][0] = 0; break; // A
        case 83: input.shiftRegisters[socket.player][1] = 0; break; // B
        case 38: input.shiftRegisters[socket.player][4] = 0; break; // up
        case 40: input.shiftRegisters[socket.player][5] = 0; break; // Down
        case 37: input.shiftRegisters[socket.player][6] = 0; break; // Left
        case 39: input.shiftRegisters[socket.player][7] = 0; break; // Right
        case 13: input.shiftRegisters[socket.player][3] = 0; break; // Start
        case 16: input.shiftRegisters[socket.player][2] = 0; break; // Select
        default:
      }
    });

    socket.on('start', () => {
      emulator.rungame();
    });

    socket.on('runFrame', () => {
      emulator.runFrame();
    });

    socket.on('disconnect', () => {
      // remove from connections;
      connections.splice(connections.indexOf(socket), 1);
      if (connections.length === 0) {
        // emulator.reset();
      }
    });
  } else {
    socket.emit('console-full');
  }
});

function sendFrame(pixData) {
  connections[0].emit('sendFrame', pixData);
}

module.exports = { sendFrame };
