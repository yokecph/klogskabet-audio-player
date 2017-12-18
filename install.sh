#!/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit
fi

DT_FILE=klogskabet-audio-buttons

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

# Add device tree if it doesn't already exist
sudo grep "dtoverlay=$DT_FILE" /boot/config.txt
if [[ $? -eq 1 ]]; then
  # Compile device tree
  dtc -W no-unit_address_vs_reg -@ -I dts -O dtb -o ./devicetree/$DT_FILE.dtbo ./devicetree/$DT_FILE.dts
  sudo cp -f ./devicetree/$DT_FILE.dtbo /boot/overlays/$DT_FILE.dtbo
  sudo printf "\n\ndtoverlay=$DT_FILE\n" >> /boot/config.txt
else
  echo "Device tree already installed, skipping"
fi
