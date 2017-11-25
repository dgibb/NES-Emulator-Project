const { ppu, chrRom } = require('./gpu');
const { memory } = require('./memory');
let { prgRom } = require('./memory');
const { cpu } = require('./cpu');
const { mapperInit } = require('./mappers');

const emulator = {

  pRAM: 'no',

  runGame() {
    cpu.timer = setInterval(emulator.runFrame, 17); // check framerate
    emulator.state = 'running';
  },

  runFrame() {
    while (ppu.scanline === 0) {
      cpu.ex(memory.readByte(cpu.pc));
    }

    while (ppu.scanline !== 0) {
      cpu.ex(memory.readByte(cpu.pc));
    }
  },

  loadROM(romFile) {
    let valid = false;
    if ((romFile[7] & 0x0C === 0x08) && ((romFile[9] << 8) < romFile.size)) {
      emulator.iNES2Handler(romFile);
      valid = true;
      console.log('set valid to true');
    } else if (((romFile[7] & 0x0C) | romFile[12] | romFile[13] | romFile[14] | romFile[15]) === 0) {
      emulator.iNESHandler(romFile);
      valid = true;
      console.log('set valid to true');
    } else {
      console.log('File Not Supported');
      // send socket event?
      prgRom = romFile;
      const header = prgRom.slice(0, 16);
      console.log(header);
      for (let i = 1; i < 16; i += 1) {
        console.log(romFile[i].toString(16));
      }
    }
    return valid;
  },


  iNESHandler(romFile) {
    console.log('iNES1.0');

    const cartHeader = [0];

    let x = 0; // rom file iterator
    for (let i = 0; i < 16; i += 1) {
      cartHeader[i] = romFile[x];
      x += 1;
    }

    // flags6
    ppu.nametableMirroring = (cartHeader[6] & 0x01) + 2;
    console.log('mirroring mode:', ppu.nametableMirroring);
    // persistant memory
    if (cartHeader[6] & 0x04) { x += 512; console.log('trainer fie exists but was ignored'); }
    if (cartHeader[6] & 0x08) { ppu.nametableMirroring = 4; console.log('mirroring mode not yet supported'); }

    // flags 7

    const prgRomSize = 16384 * cartHeader[4];
    for (let i = 0; i < prgRomSize; i += 1) {
      prgRom[i] = romFile[x];
      x += 1;
    }

    const chrRomSize = 8192 * cartHeader[5];
    for (let i = 0; i < chrRomSize; i += 1) {
      chrRom[i] = romFile[x];
      x += 1;
    }

    if (x !== romFile.length) {
      console.log('romFile!=x');
      console.log(romFile.length, '-', x, '=', romFile.length - x);
    } else {
      console.log('loading ROM miraculously Succeeded');
    }

    let mapperID = (cartHeader[6] >> 4) & 0xF;
    mapperID |= cartHeader[7] & 0xF0;
    console.log('Mapper:', mapperID);
    console.log('memory.irqVector = ', memory.irqVector);
    mapperInit(mapperID);
  },

  iNES2Handler() {
    console.log('iNES2.0');
  },

  init() {
    console.log('running emulator.init');
    ppu.init();
    cpu.wRamInit();
  },

  showState() {
    cpu.showState();
    ppu.showState();
  },

  reset() {
    cpu.reset();
    ppu.reset();
    memory.reset();
  },

};

module.exports = { emulator };
