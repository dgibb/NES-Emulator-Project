const { memory } = require('./memory');
const { debug } = require('./debug tools');
const { ppu } = require('./gpu');
const { input } = require('./input');

const cpu = {

  a: 0,
  x: 0,
  y: 0,
  pc: 0,
  sp: 0xFD,
  sr: 0x20,
  clk: 0,
  cycle: 0,
  pcPrev: 0,

  // instructions

  // 0x00
  BRK() {
    memory.writeWord((cpu.sp | 0x100) - 1, cpu.pc + 2);
    cpu.sp = (cpu.sp - 2) & 0xFF;
    memory.writeByte(cpu.sp | 0x100, cpu.sr | 0x30);
    cpu.sp = (cpu.sp - 1) & 0xFF;
    cpu.setInterruptFlag();
    cpu.pc = memory.readWord(memory.irqVector);
    cpu.clk = 7;
  },

  // 0x01
  ORA_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    cpu.a |= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x02
  HLT() {
    // todo
  },

  // 0x03 *illegal*
  SLO_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    let val = memory.readByte(addr);
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    memory.writeByte(addr, val);
    cpu.a |= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },


  // 0x04
  NOP() {
    cpu.pc += 1;
    cpu.clk = 2;
  },


  // 0x05
  ORA_ZP() {
    cpu.a |= memory.readByte(memory.readByte(cpu.pc + 1));
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0x06
  ASL_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x07 *illegal*
  SLO_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    memory.writeByte(addr, val);
    cpu.a |= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x08
  PHP() {
    memory.writeByte(cpu.sp | 0x100, (cpu.sr | 0x30));
    cpu.sp = (cpu.sp - 1) & 0xFF;
    cpu.pc += 1;
    cpu.clk = 3;
  },

  // 0x09
  ORA_IMM() {
    cpu.a |= memory.readByte(cpu.pc + 1);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0x0A
  ASL_A() {
    if (cpu.a & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    cpu.a = (cpu.a << 1) & 0xFF;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x0B *illegal*
  ANC_IMM() {
    cpu.a &= memory.readByte(cpu.pc + 1);
    if (cpu.a & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0x0C:NOP
  TOP() {
    cpu.pc += 3;
    cpu.clk = 2;
  },


  // 0x0D
  ORA_AB() {
    cpu.a |= memory.readByte(memory.readWord(cpu.pc + 1));
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x0E
  ASL_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 6;
  },

  // 0x0F *illegal*
  SLO_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    memory.writeByte(addr, val);
    cpu.a |= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 6;
  },

  // 0x10
  BPL() {
    cpu.clk = 2;
    if (!cpu.negativeFlag()) {
      cpu.pc += cpu.signDecode(memory.readByte(cpu.pc + 1));
      cpu.clk += 1;
    }
    cpu.pc += 2;
  },

  // 0x11
  ORA_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    cpu.a |= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x12:HLT

  // 0x13
  SLO_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    let val = memory.readByte(addr);
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    memory.writeByte(addr, val);
    cpu.a |= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },
  // 0x14:NOP

  // 0x15
  ORA_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    cpu.a |= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0x16
  ASL_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x17:SLO/ILL *illegal*
  SLO_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    memory.writeByte(addr, val);
    cpu.a |= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x18
  CLC() {
    cpu.resetCarryFlag();
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x19
  ORA_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    cpu.a |= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x1A:NOP
  // 0x1B:SLO/ILL*illegal*
  SLO_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    let val = memory.readByte(addr);
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    memory.writeByte(addr, val);
    cpu.a |= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },
  // 0x1C:NOP

  // 0x1D
  ORA_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    cpu.a |= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  ASL_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },

  // 0x1F:SLO/ILL
  SLO_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    memory.writeByte(addr, val);
    cpu.a |= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },


  // 0x20
  JSR() {
    debug.callStack.push(cpu.pc.toString(16));
    memory.writeWord((cpu.sp | 0x100) - 1, cpu.pc + 2);
    cpu.sp -= 2;
    cpu.pc = memory.readWord(cpu.pc + 1);
    cpu.clk = 6;
  },

  // 0x21
  AND_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    cpu.a &= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x22:HLT

  // 0x23:RLA/ILL *illegal*
  RLA_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    let val = memory.readByte(addr);
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    val |= carry;
    memory.writeByte(addr, val);
    cpu.a &= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },


  // 0x24
  BIT_ZP() {
    const val = memory.readByte(memory.readByte(cpu.pc + 1));
    if (val & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val & 0x40) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    if (!(val & cpu.a)) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0x25
  AND_ZP() {
    cpu.a &= memory.readByte(memory.readByte(cpu.pc + 1));
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0x26
  ROL_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    val |= carry;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x27 *illegal*
  RLA_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    val |= carry;
    memory.writeByte(addr, val);
    cpu.a &= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x28
  PLP() {
    cpu.sp = (cpu.sp + 1) & 0xFF;
    cpu.sr = memory.readByte(cpu.sp | 0x100);
    cpu.sr |= 0x20;
    cpu.sr &= 0xEF;
    cpu.pc += 1;
    cpu.clk = 4;
  },

  // 0x29
  AND_IMM() {
    cpu.a &= memory.readByte(cpu.pc + 1);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0x2A
  ROL_A() {
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (cpu.a & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    cpu.a = (cpu.a << 1) & 0xFF;
    cpu.a |= carry;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x2B:ANC/ILL *illegal*

  BIT_AB() {
    const val = memory.readByte(memory.readWord(cpu.pc + 1));
    if (val & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val & 0x40) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    if (!(val & cpu.a)) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x2D
  AND_AB() {
    cpu.a &= memory.readByte(memory.readWord(cpu.pc + 1));
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x2E
  ROL_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    val |= carry;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 6;
  },

  // 0x2F:RLA/ILL *illegal*
  RLA_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    val |= carry;
    memory.writeByte(addr, val);
    cpu.a &= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 6;
  },


  // 0x30
  BMI() {
    cpu.clk = 2;
    if (cpu.negativeFlag()) {
      cpu.pc += cpu.signDecode(memory.readByte(cpu.pc + 1));
      cpu.clk += 1;
    }
    cpu.pc += 2;
  },

  // 0x31
  AND_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    cpu.a &= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x32:HLT

  // 0x33:RLA/ILL *illegal*
  RLA_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    let val = memory.readByte(addr);
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    val |= carry;
    memory.writeByte(addr, val);
    cpu.a &= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },
  // 0x34:NOP

  // 0x35
  AND_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    cpu.a &= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0x36
  ROL_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    val |= carry;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x37:RLA/ILL *illegal*
  RLA_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    val |= carry;
    memory.writeByte(addr, val);
    cpu.a &= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },


  // 0x38
  SEC() {
    cpu.setCarryFlag();
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x39
  AND_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    cpu.a &= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x3A:NOP
  // 0x3B:RLA/ILL *illegal*
  RLA_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    let val = memory.readByte(addr);
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    val |= carry;
    memory.writeByte(addr, val);
    cpu.a &= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },
  // 0x3C:NOP

  // 0x3D
  AND_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    cpu.a &= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x3E
  ROL_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    val |= carry;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },

  // 0x3F:RLA/ILL *illegal*
  RLA_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    const carry = (cpu.carryFlag()) ? 1 : 0;
    if (val & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val = (val << 1) & 0xFF;
    val |= carry;
    memory.writeByte(addr, val);
    cpu.a &= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },

  // 0x40
  RTI() {
    debug.callStack.pop();
    cpu.sp = (cpu.sp + 1) & 0xFF;
    cpu.sr = memory.readByte(cpu.sp | 0x100);
    cpu.sp = (cpu.sp + 2) & 0xFF;
    cpu.pc = memory.readWord((cpu.sp | 0x100) - 1);
    cpu.sr |= 0x20;
    cpu.sr &= 0xEF;
    cpu.clk = 6;
  },

  // 0x41
  EOR_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    cpu.a ^= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x42:HLT

  // 0x43 *illegal*
  SRE_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    let val = memory.readByte(addr);
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    cpu.a ^= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },
  // 0x44:NOP

  EOR_ZP() {
    cpu.a ^= memory.readByte(memory.readByte(cpu.pc + 1));
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0x46
  LSR_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    cpu.resetNegativeFlag();
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x47 *illegal*
  SRE_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    cpu.a ^= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x48
  PHA() {
    memory.writeByte(((cpu.sp | 0x100) & 0x1FF), cpu.a);
    cpu.sp = (cpu.sp - 1) & 0xFF;
    // if (cpu.pc === 0x3A0) { console.log('PHA:', cpu.a.toString(16), cpu.x.toString(16), cpu.y.toString(16), memory.readByte(((cpu.sp+1)|0x100) & 0x1FF).toString(16),(((cpu.sp+1)|0x100) & 0x1FF).toString(16), cpu.sp.toString(16), cpu.sr.toString(16)); }
    cpu.pc += 1;
    cpu.clk = 3;
  },

  // 0x49
  EOR_IMM() {
    cpu.a ^= memory.readByte(cpu.pc + 1);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0x4A
  LSR_A() {
    if (cpu.a & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    cpu.a = (cpu.a >> 1) & 0xFF;
    cpu.resetNegativeFlag();
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x4B:SRE/ILL *illegal*
  ALR_IMM() {
    const val = memory.readByte(cpu.pc + 1);
    cpu.a &= val;
    if (cpu.a & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    cpu.a = (cpu.a >> 1) & 0xFF;
    cpu.resetNegativeFlag();
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0x4C
  JMP_A() {
    const addr = memory.readWord(cpu.pc + 1);
    cpu.pc = addr;
    cpu.clk = 3;
  },

  // 0x4D
  EOR_AB() {
    cpu.a ^= memory.readByte(memory.readWord(cpu.pc + 1));
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x4E
  LSR_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    cpu.resetNegativeFlag();
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 6;
  },

  // 0x4F *illegal*
  SRE_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    cpu.a ^= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 6;
  },

  // 0x50
  BVC() {
    cpu.clk = 2;
    if (!cpu.overflowFlag()) {
      cpu.pc += cpu.signDecode(memory.readByte(cpu.pc + 1));
      cpu.clk += 1;
    }
    cpu.pc += 2;
  },

  // 0x51
  EOR_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    cpu.a ^= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x52:HLT

  // 0x53 *illegal*
  SRE_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    let val = memory.readByte(addr);
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    cpu.a ^= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },
  // 0x54:NOP


  // 0x55
  EOR_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    cpu.a ^= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0x56
  LSR_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    cpu.resetNegativeFlag();
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x57:SRE/ILL *illegal*
  SRE_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    cpu.a ^= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x58
  CLI() {
    cpu.resetInterruptFlag();
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x59
  EOR_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    cpu.a ^= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x5A:NOP
  // 0x5B:SLO/ILL*illegal*
  SRE_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    let val = memory.readByte(addr);
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    cpu.a ^= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },
  // 0x5C:NOP

  // 0x5D
  EOR_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    cpu.a ^= memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x5E
  LSR_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    cpu.resetNegativeFlag();
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },

  // 0x5F *illegal*
  SRE_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    cpu.a ^= val;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },

  // 0x60
  RTS() {
    debug.callStack.pop();
    cpu.sp = (cpu.sp + 2) & 0xFF;
    cpu.pc = memory.readWord((cpu.sp | 0x100) - 1) + 1;
    cpu.clk = 6;
  },

  // 0x61
  ADC_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    const val = memory.readByte(addr);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x62:HLT

  // 0x63 *illegal*
  RRA_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    let val = memory.readByte(addr);
    if (cpu.carryFlag()) { val |= 0x100; }
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },
  // 0x64:NOP

  // 0x65
  ADC_ZP() {
    const addr = (memory.readByte(cpu.pc + 1));
    const val = memory.readByte(addr);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0x66
  ROR_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (cpu.carryFlag()) { val |= 0x100; }
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    memory.writeByte(addr, val);
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x67 *illegal*
  RRA_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (cpu.carryFlag()) { val |= 0x100; }
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x68
  PLA() {
    cpu.sp = (cpu.sp + 1) & 0xFF;
    cpu.a = memory.readByte(cpu.sp | 0x100);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 4;
  },

  // 0x69
  ADC_IMM() {
    const val = memory.readByte(cpu.pc + 1);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0x6A
  ROR_A() {
    if (cpu.carryFlag()) { cpu.a |= 0x100; }
    if (cpu.a & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    cpu.a >>= 1;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x6B *illegal*
  ARR_IMM() {
    cpu.a &= memory.readByte(cpu.pc + 1);
    if ((cpu.a ^ (cpu.a >> 1)) & 0x40) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    if (cpu.carryFlag()) { cpu.a |= 0x100; }
    if (cpu.a & 0x80) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    cpu.a >>= 1;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0x6C
  JMP_I() {
    const addr = memory.readWord(cpu.pc + 1);
    let jump = memory.readWord(addr);
    if ((addr & 0xFF) === 0xFF) { jump &= 0xFF; jump |= (memory.readByte(addr - 0xFF) << 8); }
    cpu.pc = jump;
    cpu.clk = 5;
  },

  // 0x6D
  ADC_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    const val = memory.readByte(addr);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x6E
  ROR_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (cpu.carryFlag()) { val |= 0x100; }
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    memory.writeByte(addr, val);
    cpu.pc += 3;
    cpu.clk = 6;
  },

  // 0x6F:ILL
  RRA_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    if (cpu.carryFlag()) { val |= 0x100; }
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 6;
  },


  // 0x70
  BVS() {
    cpu.clk = 2;
    if (cpu.overflowFlag()) {
      cpu.pc += cpu.signDecode(memory.readByte(cpu.pc + 1));
      cpu.clk += 1;
    }
    cpu.pc += 2;
  },

  // 0x71
  ADC_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    const val = memory.readByte(addr);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0x72:HLT

  // 0x73 *illegal*
  RRA_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    let val = memory.readByte(addr);
    if (cpu.carryFlag()) { val |= 0x100; }
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },
  // 0x74:NOP

  // 0x75
  ADC_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    const val = memory.readByte(addr);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0x76
  ROR_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    if (cpu.carryFlag()) { val |= 0x100; }
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    memory.writeByte(addr, val);
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x77*illegal*
  RRA_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    if (cpu.carryFlag()) { val |= 0x100; }
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x78
  SEI() {
    cpu.setInterruptFlag();
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x79
  ADC_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    const val = memory.readByte(addr);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x7A:NOP
  // 0x7B:RLA/ILL *illegal*
  RRA_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    let val = memory.readByte(addr);
    if (cpu.carryFlag()) { val |= 0x100; }
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },
  // 0x7C:NOP

  // 0x7D
  ADC_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    const val = memory.readByte(addr);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x7E
  ROR_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    if (cpu.carryFlag()) { val |= 0x100; }
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    memory.writeByte(addr, val);
    cpu.pc += 3;
    cpu.clk = 7;
  },

  // 0x7F *illegal*
  RRA_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    if (cpu.carryFlag()) { val |= 0x100; }
    if (val & 0x01) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    val >>= 1;
    memory.writeByte(addr, val);
    const carry = cpu.carryFlag() ? 1 : 0;
    let result = (cpu.a + val + carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (val ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },

  // 0x80:NOP

  // 0x81
  STA_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    memory.writeByte(addr, cpu.a);
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x82:NOP

  // 0x83 *illegal*
  SAX_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    const val = cpu.a & cpu.x;
    memory.writeByte(addr, val);
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x84
  STY_ZP() {
    memory.writeByte(memory.readByte(cpu.pc + 1), cpu.y);
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0x85
  STA_ZP() {
    memory.writeByte(memory.readByte(cpu.pc + 1), cpu.a);
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0x86
  STX_ZP() {
    memory.writeByte(memory.readByte(cpu.pc + 1), cpu.x);
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0x87 *illegal*
  SAX_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    const val = cpu.a & cpu.x;
    memory.writeByte(addr, val);
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0x88
  DEY() {
    cpu.y = (cpu.y - 1) & 0xFF;
    if (cpu.y > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.y === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x89:
  DOP() {
    cpu.pc += 2;
    cpu.clk = 2;
  },


  // 0x8A
  TXA() {
    cpu.a = cpu.x;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x8B:ILL
  XAA_IMM() {
    cpu.a = cpu.x;
    cpu.a &= memory.readByte(cpu.pc + 1);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x8C
  STY_AB() {
    memory.writeByte(memory.readWord(cpu.pc + 1), cpu.y);
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x8D
  STA_AB() {
    memory.writeByte(memory.readWord(cpu.pc + 1), cpu.a);
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x8E
  STX_AB() {
    memory.writeByte(memory.readWord(cpu.pc + 1), cpu.x);
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x8F:ILL
  SAX_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    const val = cpu.a & cpu.x;
    memory.writeByte(addr, val);
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0x90
  BCC() {
    cpu.clk = 2;
    if (!cpu.carryFlag()) {
      cpu.pc += cpu.signDecode(memory.readByte(cpu.pc + 1));
      cpu.clk += 1;
    }
    cpu.pc += 2;
  },

  // 0x91
  STA_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    memory.writeByte(addr, cpu.a);
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x92:HLT
  // 0x93: *illegal*
  AHX_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    memory.writeByte(addr, (cpu.a & cpu.x & (addr >> 8)));
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0x94
  STY_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    memory.writeByte(addr, cpu.y);
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0x95
  STA_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    memory.writeByte(addr, cpu.a);
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0x96
  STX_ZPY() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.y) & 0xFF;
    memory.writeByte(addr, cpu.x);
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0x97:ILL
  SAX_ZPY() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.y) & 0xFF;
    const val = cpu.a & cpu.x;
    memory.writeByte(addr, val);
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0x98
  TYA() {
    cpu.a = cpu.y;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x99
  STA_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    memory.writeByte(addr, cpu.a);
    cpu.pc += 3;
    cpu.clk = 5;
  },

  // 0x9A
  TXS() {
    cpu.sp = cpu.x;
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0x9B:ILL
  TAS_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    cpu.sp = cpu.a & cpu.x;
    memory.writeByte(addr, cpu.sp & (addr >> 8));
    cpu.pc += 3;
    cpu.clk = 5;
  },

  // 0x9C:ILL
  SHY_ABX() {
    const andByte = memory.readByte(cpu.pc + 2);
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    const result = andByte & cpu.y;
    if ((memory.readWord(cpu.pc + 1) & 0xFF) === (addr & 0xFF)) { memory.writeByte(addr, result); }
    cpu.pc += 3;
    cpu.clk = 5;
  },

  // 0x9D
  STA_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    memory.writeByte(addr, cpu.a);
    cpu.pc += 3;
    cpu.clk = 5;
  },

  // 0x9E:ILL
  SHX_ABY() {
    const andByte = memory.readByte(cpu.pc + 2) + 1;
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    const result = andByte & cpu.x;
    memory.writeByte(addr, result);
    // console.log(cpu.y, ' & ', andByte, ' = ', result)
    cpu.pc += 3;
    cpu.clk = 5;
  },

  // 0x9F:ILL
  AHX_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    memory.writeByte(addr, (cpu.a & cpu.x & (addr >> 8)));
    cpu.pc += 3;
    cpu.clk = 6;
  },

  // 0xA0
  LDY_IMM() {
    cpu.y = memory.readByte(cpu.pc + 1);
    if (cpu.y > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.y === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0xA1
  LDA_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    cpu.a = memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0xA2
  LDX_IMM() {
    cpu.x = memory.readByte(cpu.pc + 1);
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0xA3 *illegal*
  LAX_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    cpu.a = memory.readByte(addr);
    cpu.x = memory.readByte(addr);
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },


  // 0xA4
  LDY_ZP() {
    cpu.y = memory.readByte(memory.readByte(cpu.pc + 1));
    if (cpu.y > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.y === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0xA5
  LDA_ZP() {
    cpu.a = memory.readByte(memory.readByte(cpu.pc + 1));
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0xA6
  LDX_ZP() {
    cpu.x = memory.readByte(memory.readByte(cpu.pc + 1));
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0xA7 *illegal*
  LAX_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    cpu.a = memory.readByte(addr);
    cpu.x = memory.readByte(addr);
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0xA8
  TAY() {
    cpu.y = cpu.a;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0xA9
  LDA_IMM() {
    cpu.a = memory.readByte(cpu.pc + 1);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0xAA
  TAX() {
    cpu.x = cpu.a;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0xAB *illegal*
  LAX_IMM() {
    cpu.a = memory.readByte(cpu.pc + 1);
    cpu.x = memory.readByte(cpu.pc + 1);
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0xAC
  LDY_AB() {
    cpu.y = memory.readByte(memory.readWord(cpu.pc + 1));
    if (cpu.y > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.y === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xAD
  LDA_AB() {
    cpu.a = memory.readByte(memory.readWord(cpu.pc + 1));
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xAE
  LDX_AB() {
    cpu.x = memory.readByte(memory.readWord(cpu.pc + 1));
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xAF *illegal*
  LAX_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    cpu.a = memory.readByte(addr);
    cpu.x = memory.readByte(addr);
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xB0
  BCS() {
    cpu.clk = 2;
    if (cpu.carryFlag()) {
      cpu.pc += cpu.signDecode(memory.readByte(cpu.pc + 1));
      cpu.clk += 1;
    }
    cpu.pc += 2;
  },

  // 0xB1
  LDA_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    cpu.a = memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0xB2:HLT

  // 0xB3:*illegal*
  LAX_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    cpu.a = memory.readByte(addr);
    cpu.x = memory.readByte(addr);
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    // if (cpu.pc === 0x3A0) { console.log(addr.toString(16),((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF).toString(16)); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0xB4
  LDY_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    cpu.y = memory.readByte(addr);
    if (cpu.y > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.y === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0xB5
  LDA_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    cpu.a = memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 4;
  },


  // 0xB6
  LDX_ZPY() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.y) & 0xFF;
    cpu.x = memory.readByte(addr);
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0xB7:ILL
  LAX_ZPY() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.y) & 0xFF;
    cpu.a = memory.readByte(addr);
    cpu.x = memory.readByte(addr);
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0xB8
  CLV() {
    cpu.resetOverflowFlag();
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0xB9
  LDA_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    cpu.a = memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xBA
  TSX() {
    cpu.x = cpu.sp;
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0xBB:ILL
  LAS_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    let val = memory.readByte(addr);
    val &= cpu.sp;
    cpu.a = val;
    cpu.x = val;
    cpu.sp = val;
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xBC
  LDY_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    cpu.y = memory.readByte(addr);
    if (cpu.y > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.y === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xBD
  LDA_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    cpu.a = memory.readByte(addr);
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xBE
  LDX_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    cpu.x = memory.readByte(addr);
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xBF:ILL
  LAX_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    cpu.a = memory.readByte(addr);
    cpu.x = memory.readByte(addr);
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xC0
  CPY_IMM() {
    const val = memory.readByte(cpu.pc + 1);
    if ((cpu.y - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.y >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.y === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0xC1
  CMP_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    const val = memory.readByte(addr);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0xC2:NOP

  // 0xC3 *illegal*
  DCP_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    let val = memory.readByte(addr);
    val = (val - 1) & 0xFF;
    memory.writeByte(addr, val);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },


  // 0xC4
  CPY_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    const val = memory.readByte(addr);
    if ((cpu.y - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.y >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.y === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  CMP_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    const val = memory.readByte(addr);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0xC6
  DEC_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    val = (val - 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0xC7 *illegal*
  DCP_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    val = (val - 1) & 0xFF;
    memory.writeByte(addr, val);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },


  // 0xC8
  INY() {
    cpu.y = (cpu.y + 1) & 0xFF;
    if (cpu.y > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.y === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0xC9
  CMP_IMM() {
    const val = memory.readByte(cpu.pc + 1);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0xCA
  DEX() {
    cpu.x = (cpu.x - 1) & 0xFF;
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0xCB *illegal*
  AXS_IMM() {
    cpu.x &= cpu.a;
    const val = ((~(memory.readByte(cpu.pc + 1))) & 0xFF) + 1;
    let result = (cpu.x + val);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    cpu.x = result;
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0xCC
  CPY_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    const val = memory.readByte(addr);
    if ((cpu.y - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.y >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.y === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xCD
  CMP_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    const val = memory.readByte(addr);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xCE
  DEC_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    val = (val - 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 6;
  },

  // 0xCF:ILL
  DCP_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    val = (val - 1) & 0xFF;
    memory.writeByte(addr, val);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 6;
  },

  // 0xD0
  BNE() {
    cpu.clk = 2;
    if (!cpu.zeroFlag()) {
      cpu.pc += cpu.signDecode(memory.readByte(cpu.pc + 1));
      cpu.clk += 1;
    }
    cpu.pc += 2;
  },

  // 0xD1
  CMP_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    const val = memory.readByte(addr);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0xD2:HLT
  // 0xD3 *illegal
  DCP_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    let val = memory.readByte(addr);
    val = (val - 1) & 0xFF;
    memory.writeByte(addr, val);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },
  // 0xD4:NOP

  // 0xD5
  CMP_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    const val = memory.readByte(addr);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0xD6
  DEC_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    val = (val - 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0xD7:ILL
  DCP_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    val = (val - 1) & 0xFF;
    memory.writeByte(addr, val);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0xD8
  CLD() {
    cpu.resetDecimalFlag();
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0xD9
  CMP_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    const val = memory.readByte(addr);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xDA:NOP
  // 0xDB:ILL
  DCP_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    let val = memory.readByte(addr);
    val = (val - 1) & 0xFF;
    memory.writeByte(addr, val);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },
  // 0xDC:NOP

  // 0xDD
  CMP_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    const val = memory.readByte(addr);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xDE
  DEC_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    val = (val - 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },

  // 0xDF *illegal*
  DCP_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    val = (val - 1) & 0xFF;
    memory.writeByte(addr, val);
    if ((cpu.a - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.a === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },

  // 0xE0
  CPX_IMM() {
    const val = memory.readByte(cpu.pc + 1);
    if ((cpu.x - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.x === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },
  // 0xE1
  SBC_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    const val = ((~(memory.readByte(addr))) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0xE2:NOP

  // 0xE3 *illegal*
  ISC_IX() {
    const addr = memory.readWord((memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF);
    let val = memory.readByte(addr);
    val = (val + 1) & 0xFF;
    memory.writeByte(addr, val);
    val = ((~val) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },

  // 0xE4
  CPX_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    const val = memory.readByte(addr);
    if ((cpu.x - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.x === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0xE5
  SBC_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    const val = ((~(memory.readByte(addr))) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 3;
  },

  // 0xE6
  INC_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    val = (val + 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0xE7 *illegal*
  ISC_ZP() {
    const addr = memory.readByte(cpu.pc + 1);
    let val = memory.readByte(addr);
    val = (val + 1) & 0xFF;
    memory.writeByte(addr, val);
    val = ((~val) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0xE8
  INX() {
    cpu.x = (cpu.x + 1) & 0xFF;
    if (cpu.x > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0xE9
  SBC_IMM() {
    const val = ((~(memory.readByte(cpu.pc + 1))) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 2;
  },

  // 0xEA:NOP
  // 0xEB:ILL

  // 0xEC
  CPX_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    const val = memory.readByte(addr);
    if ((cpu.x - val) & 0x80) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.x >= val) { cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (cpu.x === val) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xED
  SBC_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    const val = ((~(memory.readByte(addr))) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xEE
  INC_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    val = (val + 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 6;
  },

  // EF:ILL
  ISC_AB() {
    const addr = memory.readWord(cpu.pc + 1);
    let val = memory.readByte(addr);
    val = (val + 1) & 0xFF;
    memory.writeByte(addr, val);
    val = ((~val) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 6;
  },


  // 0xF0
  BEQ() {
    cpu.clk = 2;
    if (cpu.zeroFlag()) {
      cpu.pc += cpu.signDecode(memory.readByte(cpu.pc + 1));
      cpu.clk += 1;
    }
    cpu.pc += 2;
  },

  // 0xF1
  SBC_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    const val = ((~(memory.readByte(addr))) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 5;
  },

  // 0xF2:HLT
  // 0xF3:ILL
  ISC_IY() {
    const addr = memory.readWord(memory.readByte(cpu.pc + 1)) + cpu.y;
    let val = memory.readByte(addr);
    val = (val + 1) & 0xFF;
    memory.writeByte(addr, val);
    val = ((~val) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 8;
  },
  // 0xF4:NOP

  // 0xF5
  SBC_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    const val = ((~(memory.readByte(addr))) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 4;
  },

  // 0xF6
  INC_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    val = (val + 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },

  // 0xF7:ILL
  ISC_ZPX() {
    const addr = (memory.readByte(cpu.pc + 1) + cpu.x) & 0xFF;
    let val = memory.readByte(addr);
    val = (val + 1) & 0xFF;
    memory.writeByte(addr, val);
    val = ((~val) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 2;
    cpu.clk = 6;
  },


  // 0xF8
  SED() {
    cpu.setDecimalFlag();
    cpu.pc += 1;
    cpu.clk = 2;
  },

  // 0xF9
  SBC_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    const val = ((~(memory.readByte(addr))) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },

  // 0xFA:NOP
  // 0xFB:ILL
  ISC_ABY() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.y;
    let val = memory.readByte(addr);
    val = (val + 1) & 0xFF;
    memory.writeByte(addr, val);
    val = ((~val) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },
  // 0xFC:NOP

  // 0xFD
  SBC_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    const val = ((~(memory.readByte(addr))) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 4;
  },


  // 0xFE
  INC_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    val = (val + 1) & 0xFF;
    memory.writeByte(addr, val);
    if (val > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (val === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },

  // 0xFF *illegal*
  ISC_ABX() {
    const addr = memory.readWord(cpu.pc + 1) + cpu.x;
    let val = memory.readByte(addr);
    val = (val + 1) & 0xFF;
    memory.writeByte(addr, val);
    val = ((~val) & 0xFF) + 1;
    const carry = cpu.carryFlag() ? 0 : 1;
    let result = (cpu.a + val - carry);
    if (result & 0x100) { result &= 0xFF; cpu.setCarryFlag(); } else { cpu.resetCarryFlag(); }
    if (((cpu.a ^ result) & (((val - 1) & 0xFF) ^ result)) & 0x80) { cpu.setOverflowFlag(); } else { cpu.resetOverflowFlag(); }
    cpu.a = result;
    if (cpu.a > 0x7F) { cpu.setNegativeFlag(); } else { cpu.resetNegativeFlag(); }
    if (cpu.a === 0) { cpu.setZeroFlag(); } else { cpu.resetZeroFlag(); }
    cpu.pc += 3;
    cpu.clk = 7;
  },

  // flag setting functions

  setCarryFlag() {
    cpu.sr |= 0x01;
  },

  resetCarryFlag() {
    cpu.sr &= 0xFE;
  },

  carryFlag() {
    if (cpu.sr & 0x01) {
      return true;
    }
    return false;
  },

  setZeroFlag() {
    cpu.sr |= 0x02;
  },

  resetZeroFlag() {
    cpu.sr &= 0xFD;
  },

  zeroFlag() {
    if (cpu.sr & 0x02) {
      return true;
    }
    return false;
  },

  setInterruptFlag() {
    cpu.sr |= 0x04;
  },

  resetInterruptFlag() {
    cpu.sr &= 0xFB;
  },

  interruptFlag() {
    if (cpu.sr & 0x04) {
      return true;
    }
    return false;
  },

  setDecimalFlag() { // not used by NES
    cpu.sr |= 0x08;
  },

  resetDecimalFlag() { // not used by NES
    cpu.sr &= 0xF7;
  },

  decimalFlag() { // not used by NES
    if (cpu.sr & 0x08) {
      return true;
    }
    return false;
  },

  setBreakFlag() {
    cpu.sr |= 0x10;
  },

  resetBreakFlag() {
    cpu.sr &= 0xEF;
  },

  breakFlag() {
    if (cpu.sr & 0x10) {
      return true;
    }
    return false;
  },

  setA1Flag() {
    cpu.sr |= 0x20;
  },

  resetA1Flag() {
    cpu.sr &= 0xDF;
  },

  a1Flag() {
    if (cpu.sr & 0x20) {
      return true;
    }
    return false;
  },

  setOverflowFlag() {
    cpu.sr |= 0x40;
  },

  resetOverflowFlag() {
    cpu.sr &= 0xBF;
  },

  overflowFlag() {
    if (cpu.sr & 0x40) {
      return true;
    }
    return false;
  },

  setNegativeFlag() {
    cpu.sr |= 0x80;
  },

  resetNegativeFlag() {
    cpu.sr &= 0x7F;
  },

  negativeFlag() {
    if (cpu.sr & 0x80) {
      return true;
    }
    return false;
  },

  // processor functions

  ex(opcode) {
    cpu.pcPrev = cpu.pc;
    instructionMap[opcode]();
    cpu.cycle += cpu.clk;
    for (let i = 0; i < 3 * cpu.clk; i += 1) {
      ppu.step();
      if (memory.mapper.interrupts) { memory.mapper.step(); }
      ppu.spriteEval();
    }
    input.step();
    if (ppu.vblDelay) { ppu.vblDelay = 0; ppu.nmiEnable = 1; }
    if (ppu.queuedIntCycles) {
      ppu.runIntCycles();
    }
  },

  reset() {
    cpu.a = 0;
    cpu.y = 0;
    cpu.x = 0;
    cpu.sp = 0xFD;
    cpu.pc = memory.readWord(memory.resetVector);
  },

  runInstruction() {
    cpu.showFunc();
    cpu.ex(memory.readByte(cpu.pc));
    cpu.showState();
    ppu.showState();
  },

  // print functions

  showFunc() {
    console.log('executing: MEMORY[', cpu.toHex4(cpu.pc), '], ', instructionMap[memory.readByte(cpu.pc)].name, ', hex ', memory.readByte(cpu.pc).toString(16));
  },

  showState() {
    console.log('current state: ');
    console.log('A: ', cpu.toHex2(cpu.a));
    console.log('X: ', cpu.toHex2(cpu.x));
    console.log('Y: ', cpu.toHex2(cpu.y));
    console.log('SR: ', cpu.toHex2(cpu.sr));
    console.log('SP: ', cpu.toHex4(cpu.sp));
    console.log('PC: ', cpu.toHex4(cpu.pc));
    console.log('PCPREV: ', cpu.toHex4(cpu.pcPrev));
  },

  unimplemented() {
    console.log('unimplemented instruction', cpu.toHex2(memory.readByte(cpu.pc)), 'at', cpu.toHex4(cpu.pc));
  },

  // helper functions

  getAddr(a, b) { // finds and returns combined address of two 8bit values
    let addr = a;
    addr <<= 8;
    addr |= b;
    return addr;
  },

  signDecode(val) {
    const neg = val & 0x80;
    let result = val;
    if (neg) {
      result = ~result & 0xFF;
      result += 1;
      result = -result;
    }
    return result;
  },

  toHex2(n) {
    let hex = n.toString(16);
    while (hex.length < 2) {
      hex = '0 + $hex';
    }
    return hex;
  },

  toHex4(n) {
    let hex = n.toString(16);
    while (hex.length < 4) {
      hex = '0 + $hex';
    }
    return hex;
  },

  // initialization functions

  wRamInit() {
    wRAM = new Array(0x800);
    for (let i = 0; i < wRAM.length; i += 1) {
      wRAM[i] = 0;
    }
  },

};

let wRAM = [];

const instructionMap = [
  cpu.BRK, // 0x00;
  cpu.ORA_IX,
  cpu.HLT,
  cpu.SLO_IX,
  cpu.DOP,
  cpu.ORA_ZP,
  cpu.ASL_ZP,
  cpu.SLO_ZP,
  cpu.PHP,
  cpu.ORA_IMM,
  cpu.ASL_A,
  cpu.ANC_IMM,
  cpu.TOP,
  cpu.ORA_AB,
  cpu.ASL_AB,
  cpu.SLO_AB,
  cpu.BPL, // 0x10
  cpu.ORA_IY,
  cpu.HLT,
  cpu.SLO_IY,
  cpu.DOP,
  cpu.ORA_ZPX,
  cpu.ASL_ZPX,
  cpu.SLO_ZPX,
  cpu.CLC,
  cpu.ORA_ABY,
  cpu.NOP,
  cpu.SLO_ABY,
  cpu.TOP,
  cpu.ORA_ABX,
  cpu.ASL_ABX,
  cpu.SLO_ABX,
  cpu.JSR, // 0x20
  cpu.AND_IX,
  cpu.HLT,
  cpu.RLA_IX,
  cpu.BIT_ZP,
  cpu.AND_ZP,
  cpu.ROL_ZP,
  cpu.RLA_ZP,
  cpu.PLP,
  cpu.AND_IMM,
  cpu.ROL_A,
  cpu.ANC_IMM,
  cpu.BIT_AB,
  cpu.AND_AB,
  cpu.ROL_AB,
  cpu.RLA_AB,
  cpu.BMI, // 0x30
  cpu.AND_IY,
  cpu.HLT,
  cpu.RLA_IY,
  cpu.DOP,
  cpu.AND_ZPX,
  cpu.ROL_ZPX,
  cpu.RLA_ZPX,
  cpu.SEC,
  cpu.AND_ABY,
  cpu.NOP,
  cpu.RLA_ABY,
  cpu.TOP,
  cpu.AND_ABX,
  cpu.ROL_ABX,
  cpu.RLA_ABX,
  cpu.RTI, // 0x40
  cpu.EOR_IX,
  cpu.HLT,
  cpu.SRE_IX,
  cpu.DOP,
  cpu.EOR_ZP,
  cpu.LSR_ZP,
  cpu.SRE_ZP,
  cpu.PHA,
  cpu.EOR_IMM,
  cpu.LSR_A,
  cpu.ALR_IMM,
  cpu.JMP_A,
  cpu.EOR_AB,
  cpu.LSR_AB,
  cpu.SRE_AB,
  cpu.BVC, // 0x50
  cpu.EOR_IY,
  cpu.HLT,
  cpu.SRE_IY,
  cpu.DOP,
  cpu.EOR_ZPX,
  cpu.LSR_ZPX,
  cpu.SRE_ZPX,
  cpu.CLI,
  cpu.EOR_ABY,
  cpu.NOP,
  cpu.SRE_ABY,
  cpu.TOP,
  cpu.EOR_ABX,
  cpu.LSR_ABX,
  cpu.SRE_ABX,
  cpu.RTS, // 0x60
  cpu.ADC_IX,
  cpu.HLT,
  cpu.RRA_IX,
  cpu.DOP,
  cpu.ADC_ZP,
  cpu.ROR_ZP,
  cpu.RRA_ZP,
  cpu.PLA,
  cpu.ADC_IMM,
  cpu.ROR_A,
  cpu.ARR_IMM,
  cpu.JMP_I,
  cpu.ADC_AB,
  cpu.ROR_AB,
  cpu.RRA_AB,
  cpu.BVS, // 0x70
  cpu.ADC_IY,
  cpu.HLT,
  cpu.RRA_IY,
  cpu.DOP,
  cpu.ADC_ZPX,
  cpu.ROR_ZPX,
  cpu.RRA_ZPX,
  cpu.SEI,
  cpu.ADC_ABY,
  cpu.NOP,
  cpu.RRA_ABY,
  cpu.TOP,
  cpu.ADC_ABX,
  cpu.ROR_ABX,
  cpu.RRA_ABX,
  cpu.DOP, // 0x80
  cpu.STA_IX,
  cpu.DOP,
  cpu.SAX_IX,
  cpu.STY_ZP,
  cpu.STA_ZP,
  cpu.STX_ZP,
  cpu.SAX_ZP,
  cpu.DEY,
  cpu.DOP,
  cpu.TXA,
  cpu.XAA_IMM,
  cpu.STY_AB,
  cpu.STA_AB,
  cpu.STX_AB,
  cpu.SAX_AB,
  cpu.BCC, // 0x90
  cpu.STA_IY,
  cpu.HLT,
  cpu.AHX_IY,
  cpu.STY_ZPX,
  cpu.STA_ZPX,
  cpu.STX_ZPY,
  cpu.SAX_ZPY,
  cpu.TYA,
  cpu.STA_ABY,
  cpu.TXS,
  cpu.TAS_ABY,
  cpu.SHY_ABX,
  cpu.STA_ABX,
  cpu.SHX_ABY,
  cpu.AHX_ABY,
  cpu.LDY_IMM, // 0xA0
  cpu.LDA_IX,
  cpu.LDX_IMM,
  cpu.LAX_IX,
  cpu.LDY_ZP,
  cpu.LDA_ZP,
  cpu.LDX_ZP,
  cpu.LAX_ZP,
  cpu.TAY,
  cpu.LDA_IMM,
  cpu.TAX,
  cpu.LAX_IMM,
  cpu.LDY_AB,
  cpu.LDA_AB,
  cpu.LDX_AB,
  cpu.LAX_AB,
  cpu.BCS, // 0xB0
  cpu.LDA_IY,
  cpu.HLT,
  cpu.LAX_IY,
  cpu.LDY_ZPX,
  cpu.LDA_ZPX,
  cpu.LDX_ZPY,
  cpu.LAX_ZPY,
  cpu.CLV,
  cpu.LDA_ABY,
  cpu.TSX,
  cpu.ILL,
  cpu.LDY_ABX,
  cpu.LDA_ABX,
  cpu.LDX_ABY,
  cpu.LAX_ABY,
  cpu.CPY_IMM, // 0xC0
  cpu.CMP_IX,
  cpu.DOP,
  cpu.DCP_IX,
  cpu.CPY_ZP,
  cpu.CMP_ZP,
  cpu.DEC_ZP,
  cpu.DCP_ZP,
  cpu.INY,
  cpu.CMP_IMM,
  cpu.DEX,
  cpu.AXS_IMM,
  cpu.CPY_AB,
  cpu.CMP_AB,
  cpu.DEC_AB,
  cpu.DCP_AB,
  cpu.BNE, // 0xD0
  cpu.CMP_IY,
  cpu.HLT,
  cpu.DCP_IY,
  cpu.DOP,
  cpu.CMP_ZPX,
  cpu.DEC_ZPX,
  cpu.DCP_ZPX,
  cpu.CLD,
  cpu.CMP_ABY,
  cpu.NOP,
  cpu.DCP_ABY,
  cpu.TOP,
  cpu.CMP_ABX,
  cpu.DEC_ABX,
  cpu.DCP_ABX,
  cpu.CPX_IMM, // 0xE0
  cpu.SBC_IX,
  cpu.DOP,
  cpu.ISC_IX,
  cpu.CPX_ZP,
  cpu.SBC_ZP,
  cpu.INC_ZP,
  cpu.ISC_ZP,
  cpu.INX,
  cpu.SBC_IMM,
  cpu.NOP,
  cpu.SBC_IMM,
  cpu.CPX_AB,
  cpu.SBC_AB,
  cpu.INC_AB,
  cpu.ISC_AB,
  cpu.BEQ, // 0xF0
  cpu.SBC_IY,
  cpu.HLT,
  cpu.ISC_IY,
  cpu.DOP,
  cpu.SBC_ZPX,
  cpu.INC_ZPX,
  cpu.ISC_ZPX,
  cpu.SED,
  cpu.SBC_ABY,
  cpu.NOP,
  cpu.ISC_ABY,
  cpu.TOP,
  cpu.SBC_ABX,
  cpu.INC_ABX,
  cpu.ISC_ABX,
];


module.exports = { cpu, wRAM };
