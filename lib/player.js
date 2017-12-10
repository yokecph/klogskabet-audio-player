// export a simple wrapper/api object for an mpg123 process
module.exports = function () {
  // The mpg123 process
  var process = null;

  // playback stats in seconds
  // (-1 means nothing's been played yet)
  var elapsed = -1;
  var remaining = -1;
  var state = 0;

  // create an API class derived from event emitter
  const EventEmitter = require('events');
  class Api extends EventEmitter {
    // load and play the given file
    load(filePath) {
      sendCommand(`LOAD ${filePath}`);
    }

    // load - but don't auto-play - the given file
    loadPaused(filePath) {
      sendCommand(`LOADPAUSED ${filePath}`);
    }

    // pause/unpause playback
    playPause() {
      sendCommand('PAUSE');
    }

    // get the current state
    // 0: Nothing loaded/playback stopped
    // 1: Track paused
    // 2: Track playing
    get state() {
      return state;
    }

    // get whether playback is paused
    // (NOTE: This is potentially unreliable as it's determined sort of
    // indirectly)
    get isPlaying() {
      return state === 2;
    }

    // get the duration (float, seconds). Negative value means nothing's
    // playing.
    // Note that the value may be a little unstable due to float stuff.
    get duration() {
      if (elapsed < 0) {
        return -1;
      }

      return elapsed + remaining;
    }

    // get the elapsed time (float, seconds). Negative value means nothing's
    // playing
    get elapsed() {
      return elapsed;
    }

    // get the elapsed time (float, seconds). Negative value means nothing's
    // playing
    get remaining() {
      return remaining;
    }

    // quit the process
    quit () {
      sendCommand('QUIT'); // note: this command is undocumented
    }
  };

  // instantiate a new api obj
  const api = new Api;

  // This function handles new stdout data from the process
  // (defined as the return value of an IIFE to allow for some private state
  // variables)
  const readStatus = (function () {
    var data = '';

    return function (chunk) {
      var timestamps = [];
      data += chunk.toString();

      // replace() is the poor man's scan() - find and parse various output
      // lines, removing the matched content from the data buffer

      // find and emit errors
      data = data.replace(/@E ([^\n]+)\n/g, (_, msg) => {
        api.emit('error', msg);
        return '';
      });

      // find timestamps
      data = data.replace(/@F \d+ \d+ ([\d.]+) ([\d.]+)\n/g, (_, elapsed, remaining) => {
        timestamps.push([parseFloat(elapsed), parseFloat(remaining)]);
        return '';
      });

      // look for state declarations
      data = data.replace(/@P (\d)\n/, (_, stateNumber) => {
        var number = parseInt(stateNumber, 10);
        if (state != number) {
          state = number;

          // if we're stopped, set timestamps to -1,-1 so that'll get emitted
          // as a timestamp event
          if (state === 0) {
            timestamps = [[-1, -1]];
          }

          // emit statechange event
          api.emit('statechange', number);

          // emit stopped/paused/playing event
          var event = ['stopped', 'paused', 'playing'][state];
          if (event) {
            api.emit(event);
          } else {
            console.warn(`Unknown state: ${state}`)
          }
        }
        return '';
      });

      // if we found some timestamps, set the latest one and emit an event
      if (timestamps.length) {
        [elapsed, remaining] = timestamps.pop();
        api.emit('timestamp', elapsed, remaining);
      }

      // remove any other output tokens (keep the data buffer from growing)
      data = data.replace(/@\w+[^\n]+\n/g, '');
    };
  }());

  // spawns a new process, killing any existing ones
  const spawn = function () {
    const childProcess = require('child_process');

    // detatch from existing process, if any
    if (process) {
      process.stdout.off('data', readStatus);
    }

    // kill all other players, just in case
    try {
      childProcess.execSync('killall mpg123 1>&2 2>/dev/null');
    } catch (e) {
      // no-op
    }

    // the --mono argument forces the audio to be mixed down to mono
    // the --remote argument let's us send commands via stdio
    process = childProcess.spawn('mpg123', ['--mono', '--remote'], {
      stdio: ['pipe', 'pipe', 'ignore'] // don't care about stderr
    });

    // attach to the new process
    process.stdout.on('data', readStatus);
  };

  // send a command to the mpg123 process
  const sendCommand = function (cmd) {
    if (!process) {
      return;
    }

    process.stdin.write(cmd + '\n');
  };

  // spawn an mpg123 process
  spawn();

  // return an API
  return api;
};
