const memory = require('./memory');

const interrupt = {

  step() {
    memory.mapper.irqStep();
  },
};
