# Klogskabet - Audio player
©2017 YOKE ApS. All rights reserved.

## Description
This is a simple Node.js app for the Klogskabet audio module. It wraps an `mpg123` process to play the MP3 audio files assigned to it in the Klogskabet CMS.

The code specifically targets a Raspberry Pi 3 running Raspbian "stretch", using a JustBoom DAC hat for audio output.

## Requirements
- Raspbian "stretch"
- Node.js 8.x & npm
- `mpg123`

## Installation
NOTE: The following assumes you're running a regular Raspberry Pi with a passwordless-sudo `pi` user account. The config files for this app assumes the app will be installed in `/home/pi/klogskabet-audio-player/`.

Of course it also assumes that 

Fist, install the JustBoom DAC hardware and enable its device tree overlay (see also [JustBoom's docs](https://www.justboom.co/software/configure-justboom-with-raspbian/)), by editing `/boot/config.txt` (e.g. with `$ sudo nano /boot/config.txt`):

1. Change the line `dtparam=audio=on` to `dtparam=audio=off`
2. Add the line `dtoverlay=justboom-dac`

Next, install dependencies (Node.js 8.x, device-tree compiler, and `mpg123`):

    $ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    $ sudo apt-get update
    $ sudo apt-get install -y nodejs build-essential device-tree-compiler mpg123

Download or clone this source code, and cd into the `/home/pi/klogskabet-audio-player` directory (if you've downloaded a .zip from GitHub, you may have to rename the directory to get rid of the branch name).

    $ cd klogskabet-audio-player

Compile the device-tree-overlay for the buttons, and move it to `/boot/overlays/`:

    $ dtc -W no-unit_address_vs_reg -@ -I dts -O dtb -o ./devicetree/klogskabet-audio-buttons.dtbo ./devicetree/klogskabet-audio-buttons.dts
    $ sudo cp ./devicetree/klogskabet-audio-buttons.dtbo /boot/overlays/klogskabet-audio-buttons.dtbo
    $ sudo chown root:root /boot/overlays/klogskabet-audio-buttons.dtbo

Install the overlay by editing `/boot/config.txt` again and add the line `dtoverlay=klogskabet-audio-buttons`.

Install npm packages

    $ npm install

Set up the device's ID for use with the CMS by copying the example config, and editing it:

    $ cp config/device.js.example config/device.js
    $ nano config/device.js

Reboot the Raspberry Pi:

    $ sudo reboot

Test the setup by issuing:

    $ sudo node index.js

Provided everything works, perform these final two steps to make the app start automatically and manage log files:

Install the logrotate configuration:

    $ sudo cp ./config/klogskabet-audio-player.logrotate /etc/logrotate.d/klogskabet-audio-player.logrotate
    $ sudo chmod 744 /etc/logrotate.d/klogskabet-audio-player.logrotate
    $ sudo chown root:root /etc/logrotate.d/klogskabet-audio-player.logrotate

And install the systemd service script:

    $ sudo cp ./config/klogskabet-audio-player.service /lib/systemd/system/klogskabet-audio-player.service
    $ sudo systemctl daemon-reload
    $ sudo systemctl enable klogskabet-audio-player.service

## Overview
The app loads a playlist of MP3 files from the Klogskabet CMS, and loops through it.

Three GPIO-connected buttons allow users to skip to the next/previous track, and play/pause the current track.

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

### Committing
Adhere to the `git-flow` model for branching etc..

## Version history
### 1.0.0
Initial commit.
