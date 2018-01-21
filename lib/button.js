const EventEmitter = require('events');
const Gpio = require('onoff').Gpio;

class Button extends EventEmitter {

  constructor(gpioPin) {
    super();
    this.gpio = new Gpio(gpioPin, 'in', 'falling');
    this.prevState = this.gpio.readSync();
    this.lastPress = 0;

    this.gpio.watch((err, state) => {
      if (err) {
        console.error('Error in GPIO watch: ', err);
        return;
      }

      if (state !== this.prevState && state === 0) {
        process.nextTick(_ => {
          if (Date.now() - this.lastPress > 100) {
            this.lastPress = Date.now();
            this.emit('press');
          }
        });
      }

      this.prevState = state;
    });
  }

  destroy() {
    this.gpio.unexport();
  }

}

module.exports = Button;
