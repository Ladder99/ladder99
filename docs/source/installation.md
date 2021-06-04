# Installation

## Requirements

- An edge device running Linux (e.g. a Raspberry Pi)

## Steps

1. SSH into the edge device using its local name or IP address and your username and password, e.g.

   ssh pi@raspberrypi.local
   (password)

1. Clone this repo there

   git clone https://github.com/Ladder99/ladder99
   cd ladder99

1. Install dependencies **in this order** (may take a while) -

   shell/install/linux
   shell/install/docker
   shell/install/docker-compose
   shell/install/node
   shell/install/python

Next, we'll run the MTConnect Agent and make sure it works with the demonstration data.
