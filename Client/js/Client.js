/* eslint-disable no-undef, no-console, no-alert, no-unused-vars */
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
    for (let i = 0; i < pixData.length; i += 4) {
      pixData[i] = 0;
      pixData[i + 1] = 0;
      pixData[i + 2] = 0;
      pixData[i + 3] = 255;
    }
    screen.putImageData(pixData, 0, 0);

    const socket = window.io('localhost:5000');
    socket.on('sendFrame', (frameData) => {
      console.log('sendFrame event hit');
      screen.putImageData(frameData, 0, 0);
    });
  },
};

export default { Client };
