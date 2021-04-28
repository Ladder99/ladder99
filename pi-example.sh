# copy this to pi.sh and update values before using `just deploy-adapter` etc

export PI_URL=192.168.0.109
export PI_USER=pi
export PI_PASSWORD=password

export PI=$PI_USER@$PI_URL
alias enterpwd="./bin/macos/passh -p env:PI_PASSWORD"
