const Player = require('./lib/player.js');
const Button = require('./lib/button.js');
const Display = require('./lib/display.js');

const prevButton = new Button(17);
const playPauseButton = new Button(27);
const nextButton = new Button(22);

prevButton.on('press', _ => {
  playPrevious();
});

playPauseButton.on('press', _ => {
  player.playPause();
});

nextButton.on('press', _ => {
  playNext();
});

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

  player.load(track);
  list.push(track);
}

// grab the last track in the array, load and play it, and put it back in
// the list at the head of the list
function playPrevious() {
  if (!list.length) {
    console.warn("No tracks!");
    return;
  }

  var track = list.pop();

  player.load(track);
  list.unshift(track);
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


const lcd = new Display({
  rs: 5,
  e: 6,
  data: [13, 26, 16, 20],
  cols: 20,
  rows: 2
});

player.on('loaded', (file) => lcd.title = file);
player.on('timestamp', (elapsed) => lcd.time = elapsed);

// If ctrl+c is hit, free resources and exit.
process.on('SIGINT', _ => {
  playPauseButton.destroy();
  nextButton.destroy();
  prevButton.destroy();
  lcd.destroy();
  process.exit();
});

