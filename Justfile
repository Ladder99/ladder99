# use with https://github.com/casey/just

make:
    cd parts/elevator && node code/src/index.js config/devices.yaml > config/devices.xml
    cp parts/elevator/config/devices.xml parts/agent/config

recipe-name:
    echo 'This is a recipe!'

# this is a comment
another-recipe:
    @echo 'This is another recipe.'

