const Player = require('./lib/player.js');
const Gpio = require('onoff').Gpio;

const buttons = [
  new Gpio(17, 'in', 'falling'),
  new Gpio(27, 'in', 'falling'),
  new Gpio(22, 'in', 'falling')
];

buttons.forEach(function (button, i) {
  button.watch(function (err) {
    if (err) {
      console.error(err);
      return;
    }

    console.log(`Button #${i} pressed`);
  });
});

process.on('SIGINT', function () {
  buttons.forEach(button => button.unexport());
});

// a simple helper function
function formatTime(time) {
  var seconds = (time % 60).toFixed(3);
  var minutes = time / 60 | 0;
  var hours = time / 3600 | 0;

  function pad(n) {
    return `00${n}`.slice(-2);
  }

  var string = `${pad(minutes)}:${seconds}`;
  if (hours > 0) {
    string = `${hours}:${string}`;
  }

  return string;
}

// create a new player (spawns an mpg123 process)
var player = new Player();

// not super necessary, but let's be nice and clean up after ourselves
process.on('exit', function () {
  player.quit();
});

// list of tracks to play
const list = [
  'test/1.mp3',
  'test/2.mp3',
  'test/3.mp3'
];

// grab the first track in the array, load and play it, and put it back in
// the list at the end
function playNext() {
  if (!list.length) {
    console.warn("No tracks!");
    return;
  }

  var track = list.shift();
  player.once('playing', function () {
    console.log(`Playing ${track}`);
  });

  player.load(track);
  list.push(track);
}

// when playback stops, play the next track
player.on('stopped', playNext);

player.on('error', function (msg) {
  console.warn(msg);
  playNext();
});

// uncomment to log timestamps
/*
player.on('timestamp', function (elapsed, remaining) {
  console.log(formatTime(elapsed) + " of " + formatTime(player.duration));
})
*/

// start playing
playNext();
