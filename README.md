# Klogskabet - Audio player
©2017 YOKE ApS. All rights reserved.

## Description
This is a minimal Node.js app, which wraps an mpg123 process to play MP3 audio files.

The code specifically targets a Raspberry Pi 3 running Raspbian "stretch", using a JustBoom DAC hat for audio output.

## Requirements
- Raspbian "stretch"
- Node.js 8.x & npm
- `mpg123`

## Overview
This is a very early version, that doesn't do a whole lot. It just loops through a list of 3 test MP3 files.

`index.js` is the main "controller" and entry point. The `lib/player.js` file exposes an API wrapper for a `mpg123` process.

### Player API
The player is rather simple:

#### Methods
##### `Player#load(filePath) => undefined`
Load and play the given file

##### `Player#loadPaused(filePath) => undefined`
Load - but don't auto-play - the given file

##### `Player#playPause() => undefined`
Toggle pause. Note that pausing might seem "delayed" slightly. This is mpg123's fault; it doesn't clear the audio buffer when pausing, so anything already in there will play.

##### `Player#quit() => undefined`
Quit the mpg123 process. Note that if this is called, the player object becomes pretty usable.

#### Properties
##### `Player#state => number`
A number describing the state:  
`0`: Stopped (no track loaded)  
`1`: Paused (track loaded)  
`2`: Playing

##### `Player#isPlaying => boolean`
Whether anything is being played.

##### `Player#elapsed => number`
Get elapsed time in seconds.

##### `Player#remaining => number`
Get remaining time in seconds.

#### Events
##### `playing`
State changed to playing.

##### `paused`
State changed to paused.

##### `stopped`
Playback stopped.

##### `statechange: number`
State (playing/paused/stopped) changed. Listeners receive the new state number. This is emitted before the specfic `paused`/`playing`/`stopped` events.

##### `timestamp: number, number`
Elapsed/remaining time updated. Listeners receive both values as numbers. The values may be negative, indicating nothing's playing.

##### `error: message`
mpg123 spat out an error. Listeners receive the error text.

## Development
The version number in `package.json` should be bumped for new releases (and `npm install` should be run to update `package-lock.json` before committing!).

### Known issues
- Pausing is "delayed" slightly, as mpg123 doesn't clear already-buffered audio when pausing, so that has to play through.

### Roadmap
- Set up physical controls with Raspberry Pi GPIO button-pushes (see, for instance, [this npm package](https://github.com/fivdi/onoff)).

- Set up LCD display readout (see, for instance, [this npm package](https://github.com/fivdi/lcd)). Should display title and time remaining? Should briefly display IP address(es) on startup?

- Download files/content to play from CMS.

- Figure out whether to grab display info from ID3 tags or elsewhere.

- Register as a service to have it start automatically on boot.

### Committing
Adhere to the `git-flow` model for branching etc..

## Deployment
TBD.

## Version history
### 1.0.0
Initial commit.
