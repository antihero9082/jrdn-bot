JRDN Turntable.fm Bot
=====================

A clean, simple, and easily customizable Turntable.fm bot written in node.js utilizing [ttapi](https://github.com/alaingilbert/Turntable-API).

## Installation

### 1) Download

    git clone https://github.com/jstout24/jrdn-bot.git
    cd jrdn-bot
    npm install


### 2) Initialize Bot

Create a new file `bot.js` with the contents of:

    var jrdnBot = require('jrdn-bot');

    var options = {
        auth:    'your-auth-here',
        user_id: 'your-user-id',
        room_id: 'your-room-id',
        max_dj_plays: 4
    };

    jrdnBot.boot(options);