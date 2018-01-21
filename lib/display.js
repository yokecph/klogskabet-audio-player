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

  print(line1, line2) {
    this.line1 = String(line1 || "");
    this.line2 = String(line2 || "");
    this.update();
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

    // local copy since later use is async
    const l1 = this.line1.slice(0, 20);
    const l2 = this.line2.slice(0, 20);

    // don't do pointless updates
    if (l1 === this.lastLine1 && l2 === this.lastLine2) {
      return;
    }

    this.busy = true;
    this.lcd.clear();
    this.lcd.print(l1, _ => {
      this.lcd.setCursor(0, 1);
      this.lcd.print(l2, _ => {
        this.busy = false;
        this.lastLine1 = l1;
        this.lastLine2 = l2;
      });
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
