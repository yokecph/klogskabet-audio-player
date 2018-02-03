const Player = require('./lib/player.js');
const Button = require('./lib/button.js');
const Display = require('./lib/display.js');

const prevButton = new Button(22);
const playPauseButton = new Button(27);
const nextButton = new Button(17);

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

// ================================

const lcd = new Display({
  rs: 5,
  e: 6,
  data: [13, 26, 16, 20],
  cols: 20,
  rows: 2
});

// ================================

// load content
const request = require('request');
const fs = require('fs');
const path = require('path');
const transliterate = require('transliteration').transliterate;

const playlist = [];
var config = {};

try {
  config = require('./config/device.js');
} catch(err) {
  // no-op
}

if (!config.id) {
  lcd.print("No device ID :(");
} else {
  lcd.print(config.id, "Loading...");

  request.get(`http://klogskabet.yoke.dk/api/devices/${config.id}.json`, (error, res, body) => {
    if (res.statusCode !== 200) {
      if (res.statusCode === 404) {
        lcd.print(config.id, "No content :(");
      } else {
        lcd.print("HTTP error " + res.statusCode);
      }
      return;
    }

    if (error) {
      lcd.print("An error occurred :(");
      console.error(error);
      return;
    }

    lcd.print(config.id, "Downloading...");

    try {
      const json = JSON.parse(body);
      const tracks = json.tracks;
      const trackCount = tracks.length;

      if (!trackCount) {
        lcd.print(config.id, "No tracks :(");
        return;
      }

      // clean up old tracks
      const oldFiles = fs.readdirSync(`${__dirname}/tmp/`);
      oldFiles.forEach(file => {
        if (/\.mp3$/.test(file)) {
          const name = path.basename(file, '.mp3');
          if (!json.tracks.find(track => track.checksum === name)) {
            fs.unlinkSync(`${__dirname}/tmp/${file}`);
          }
        }
      });

      function downloadNextTrack() {
        const track = tracks.shift();

        // done downloading, play first track
        if (!track) {
          playNext();
          return;
        }

        lcd.print("Downloading...", `${trackCount - tracks.length} of ${trackCount}`);

        const fileName = `${__dirname}/tmp/${track.checksum}.mp3`;

        // skip downloading existing files
        if (fs.existsSync(fileName)) {
          playlist.push({
            localFile: fileName,
            title: transliterate(track.title)
          });
          process.nextTick(downloadNextTrack);
          return;
        }

        // download track
        const req = request(track.url)
          .on('response', (res) => {
            if (res.statusCode === 200) {
              const stream = fs.createWriteStream(fileName);

              stream.on('finish', _ => {
                playlist.push({
                  localFile: fileName,
                  title: transliterate(track.title)
                });

                downloadNextTrack();
              });

              stream.on('error', (err) => {
                console.log("Write stream error", err);
                lcd.print("Download error...", ":(");
              });

              req.pipe(stream);
            } else {
              console.log("Unexpected status: " + res.statusCode);
              lcd.print("Download error...", ":(");
            }
          })
          .on('error', function () {
             console.error("Track download error", arguments);
             lcd.print("Download error...", ":(");
          });
      }

      downloadNextTrack();

    } catch (e) {
      console.error("JSON parse error", e);
      lcd.print("Download error...", ":(");
      return;
    }
  });
}

// grab the first track in the array, load and play it, and put it back in
// the list at the end
function playNext() {
  if (!playlist.length) {
    console.warn("No tracks!");
    return;
  }

  var track = playlist.shift();
  playlist.push(track);

  player.load(track.localFile);
}

// grab the last track in the array, load and play it, and put it back in
// the list at the head of the list
function playPrevious() {
  if (!playlist.length) {
    console.warn("No tracks!");
    return;
  }

  var track = playlist.pop();
  playlist.unshift(track);

  player.load(track.localFile);
}

// when playback stops, play the next track
player.on('stopped', playNext);

player.on('error', function (msg) {
  console.warn(msg);
  playNext();
});

player.on('loaded', (file) => {
  const track = playlist.find(track => track.localFile === file);
  lcd.title = track && track.title ? track.title : "Untitled";
});

player.on('timestamp', (elapsed) => lcd.time = elapsed);

// If ctrl+c is hit, free resources and exit.
process.on('SIGINT', _ => {
  playPauseButton.destroy();
  nextButton.destroy();
  prevButton.destroy();
  lcd.destroy();
  process.exit();
});
