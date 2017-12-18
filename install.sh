#!/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit
fi

# Copy logrotate script into position
sudo cp ./config/klogskabet-audio-player.logrotate /etc/logrotate.d/klogskabet-audio-player.logrotate
sudo chmod 744 /etc/logrotate.d/klogskabet-audio-player.logrotate
sudo chown root:root /etc/logrotate.d/klogskabet-audio-player.logrotate

# Copy service script and set its permissions
sudo cp ./config/klogskabet-audio-player.service /lib/systemd/system/klogskabet-audio-player.service
sudo chmod 644 /lib/systemd/system/klogskabet-audio-player.service

# Reload services and enable
sudo systemctl daemon-reload
sudo systemctl enable klogskabet-audio-player.service
sudo systemctl start klogskabet-audio-player.service
