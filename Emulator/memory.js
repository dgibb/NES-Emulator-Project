const { ppu } = require('./gpu');
const { apu } = require('./apu');
const { cpu, wRAM } = require('./cpu');

const memory = {

  mapper: 0,
  irqVector: 0xFFFE,
  nmiVector: 0xFFFA,
  resetVector: 0xFFFC,

  readByte(addr) {
    switch (addr & 0xF000) {
      case 0x0000:
      case 0x1000:
        return wRAM[addr % 0x800];

      case 0x2000:
      case 0x3000:
        if (addr === 0x2014) {
          return ppu.oamDMAreg;
        }
        return ppu.readByte(addr);

      case 0x4000:
        if (addr < 0x4020) {
          return apu.readByte(addr);
        }
        return memory.mapper.readByte(addr);

      case 0x5000:
      case 0x6000:
      case 0x7000:
      case 0x8000:
      case 0x9000:
      case 0xA000:
      case 0xB000:
      case 0xC000:
      case 0xD000:
      case 0xE000:
      case 0xF000:
        return memory.mapper.readByte(addr);

      default:
        return 0xFF;
    }
  },

  readWord(addr) {
    let data = 0;
    if (addr === 0xFF) { data = memory.readByte(addr - 0xFF); } else { data = memory.readByte(addr + 1); }
    data <<= 8;
    data |= memory.readByte(addr);
    return data;
  },


  writeByte(addr, data) {
    switch (addr & 0xF000) {
      case 0x0000:
      case 0x1000:
        wRAM[addr % 0x800] = data;
        break;

      case 0x2000:
      case 0x3000:
        ppu.writeByte(addr, data);
        break;


      case 0x4000:
        if (addr < 0x4020) {
          if (addr === 0x4014) {
            ppu.oamDMAreg(data);
          } else {
            apu.writeByte(addr, data);
          }
        } else {
          memory.mapper.writeByte(addr, data);
        }
        break;

      case 0x5000:
      case 0x6000:
      case 0x7000:
      case 0x8000:
      case 0x9000:
      case 0xA000:
      case 0xB000:
      case 0xC000:
      case 0xD000:
      case 0xE000:
      case 0xF000:
        memory.mapper.writeByte(addr, data);
        break;

      default:
        break;
    }
  },

  writeWord(addr, data) {
    const data2 = data & 0xFF;
    data >>= 8;
    memory.writeByte(addr + 1, data);
    memory.writeByte(addr, data2);
  },

  /*

  Not really necessary anymore

  printChecksums(){ // print test rom checksums
    console.log(memory.readByte(0x12).toString(16), memory.readByte(0x13).toString(16), memory.readByte(0x14).toString(16), memory.readByte(0x15).toString(16))
  },
  */

  printStack() {
    let ptr = cpu.sp | 0x100;
    while (ptr < 0x200) {
      console.log(cpu.toHex2(memory.readByte(ptr)));
      ptr += 1;
    }
  },

};

const prgRom = [];

module.exports = { memory, prgRom };
