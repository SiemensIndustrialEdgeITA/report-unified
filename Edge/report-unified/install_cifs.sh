#!/bin/sh

# install packages
apt-get update
apt-get install -y cifs-utils

# create a folder to be mounted
mkdir -p /mnt/winshare

# clean
rm -rf /var/lib/apt/lists/*
apt autoremove
apt-get clean