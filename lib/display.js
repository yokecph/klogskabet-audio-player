const EventEmitter = require('events');
const Lcd = require('lcd');

class Display extends EventEmitter {

  constructor(options) {
    super();
    this.line1 = "Klogskabet";
    this.line2 = "";
    this.busy = true;
    this.lcd = new Lcd(options);
    this.lcd.on('ready', _ => {
      this.busy = false;
      setInterval(this.update.bind(this), 100);
    });
  }

  set title(title) {
    this.line1 = title;
    this.update();
  }

  set time(seconds) {
    const formatted = this.formatTime(seconds);
    this.line2 = `                    ${formatted}`.slice(-20);
    this.update();
  }

  update() {
    if (this.busy) {
      return;
    }

    this.busy = true;
    this.lcd.clear();
    this.lcd.print(this.line1.slice(0, 20), _ => {
      this.lcd.setCursor(0, 1);
      this.lcd.print(this.line2);
      this.busy = false;
    });
  }

  formatTime(time) {
    var seconds = (time % 60) | 0;
    var minutes = time / 60 | 0;
    var hours = time / 3600 | 0;

    const pad = n => `00${n}`.slice(-2);

    var string = `${pad(minutes)}:${pad(seconds)}`;
    if (hours > 0) {
      string = `${hours}:${string}`;
    }

    return string;
  }

  destroy() {
    this.lcd.close();
  }

}

module.exports = Display;