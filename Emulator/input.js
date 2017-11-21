const apu = require('./apu');

const input = {

  shiftRegisters: [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]],
  strobe1: [0, 0],

  keyDown(e) {
    switch (e.keyCode) {
      case 65: input.shiftRegisters1[0] = 1; break; // A
      case 83: input.shiftRegisters1[1] = 1; break; // B
      case 38: input.shiftRegisters1[4] = 1; break; // up
      case 40: input.shiftRegisters1[5] = 1; break; // Down
      case 37: input.shiftRegisters1[6] = 1; break; // Left
      case 39: input.shiftRegisters1[7] = 1; break; // Right
      case 13: input.shiftRegisters1[3] = 1; break; // Start
      case 16: input.shiftRegisters1[2] = 1; break; // Select
      default:
    }
  },

  keyUp(e) {
    switch (e.keyCode) {
      case 65: input.shiftRegisters1[0] = 0; break; // A
      case 83: input.shiftRegisters1[1] = 0; break; // B
      case 38: input.shiftRegisters1[4] = 0; break; // up
      case 40: input.shiftRegisters1[5] = 0; break; // Down
      case 37: input.shiftRegisters1[6] = 0; break; // Left
      case 39: input.shiftRegisters1[7] = 0; break; // Right
      case 13: input.shiftRegisters1[3] = 0; break; // Start
      case 16: input.shiftRegisters1[2] = 0; break; // Select
      default:
    }
  },

  step() {
    if (apu.joypad1) {
      input.strobe[0] = 0;
    }

    if (apu.joypad2) {
      input.strobe[1] = 0;
    }
  },
};
