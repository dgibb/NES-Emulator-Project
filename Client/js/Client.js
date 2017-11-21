/* eslint-disable no-undef, no-console */
/* eslint-env browser */

const Client = {

  runFrame() {
    socket.emit('runFrame');
  },

  init() {
    console.log('onload worked');
    const canvas = document.getElementById('screen');
    const screen = canvas.getContext('2d');
    const pixData = screen.createImageData(256, 240);
    for (let i = 0; i < pixData.length; i += 1) {
      pixData[i] = 255;
    }
    screen.putImageData(pixData, 0, 0);

    const socket = window.io('localhost:5000');
    socket.on('sendFrame', (frameData) => {
      screen.putImageData(frameData, 0, 0);
    });
  },
};
