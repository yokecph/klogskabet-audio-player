#!/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit
fi

function addLineIfMissing {
  sudo grep $1 $2
  if [[ $? -eq 1 ]]; then
    sudo printf "\n$1\n" >> $2
  fi
}


echo "Updating apt..."
sudo apt-get update

if ! [ -x "$(command -v nodejs)" ]; then
  echo "Installing Node.js and build-essential..."
  curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
  sudo apt-get install -y nodejs build-essential
fi

if ! [ -x "$(command -v dtc)" ]; then
  echo "Installing device tree compiler..."
  sudo apt-get install -y device-tree-compiler
fi

if ! [ -x "$(command -v mpg123)" ]; then
  echo "Installing mpg123..."
  sudo apt-get install -y mpg123
fi

OVERLAY=klogskabet-audio-buttons

# Copy logrotate script into position
echo "Installing logrotate conf..."
sudo cp ./config/klogskabet-audio-player.logrotate /etc/logrotate.d/klogskabet-audio-player.logrotate
sudo chmod 744 /etc/logrotate.d/klogskabet-audio-player.logrotate
sudo chown root:root /etc/logrotate.d/klogskabet-audio-player.logrotate

# Copy service script and set its permissions
echo "Installing service script..."
sudo cp ./config/klogskabet-audio-player.service /lib/systemd/system/klogskabet-audio-player.service
sudo chmod 644 /lib/systemd/system/klogskabet-audio-player.service
# Reload services and enable
sudo systemctl daemon-reload
sudo systemctl enable klogskabet-audio-player.service
# sudo systemctl start klogskabet-audio-player.service

# Add device tree overlay if it doesn't already exist
if [[ $? -eq 1 ]]; then
  echo "Compiling device tree overlay..."
  dtc -W no-unit_address_vs_reg -@ -I dts -O dtb -o ./devicetree/$OVERLAY.dtbo ./devicetree/$OVERLAY.dts
  sudo cp -f ./devicetree/$OVERLAY.dtbo /boot/overlays/$OVERLAY.dtbo
fi
