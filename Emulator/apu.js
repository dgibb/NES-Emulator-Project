const { input } = require('./input');

const apu = {

  joypad1: 0, // 0x4016 (write/set strobe)
  joypad2: 0, // 0x4017 (write/set strobe)

  readByte(addr) {
    switch (addr) {
      case 0x4016:
        const out1 = input.shiftRegisters[0][input.strobe[0]];
        input.strobe1 = (input.strobe[0] + 1) % 8;
        return out1;

      case 0x4017:
        const out2 = input.shiftRegisters[1][input.strobe[1]];
        input.strobe = (input.strobe[1] + 1) % 8;
        return out2;

      default:
        return 0;
    }
  },

  writeByte(addr, data) {
    switch (addr) {
      case 0x4016:
        apu.joypad1 = data & 0x01;
        break;

      case 0x4017:
        apu.joypad2 = data & 0x01;
        break;

      default:
      // console.log('apu.writeByte: unimplemented byte', addr);
        break;
    }
  },

/*

Generate Audio Waveforms

var Audio=new AudioContext();
var gainNode1 = Audio.createGain();

var oscillator1 = Audio.createOscillator();
var oscillator2 = Audio.createOscillator();

oscillator1.connect(gainNode1);
oscillator2.connect(gainNode1);

gainNode1.connect(Audio.destination);

oscillator2.frequency.value=1024;
*/

};
