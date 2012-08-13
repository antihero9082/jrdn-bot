var ttapi   = require('ttapi')
  , fs      = require('fs')
  , request = require('request')
;

/**
 * JRDNbot object.
 *
 * @constructor
 */
var JRDNbot = function(options) {
    if (typeof options == 'undefined') {
        throw new Error('JRDNbot options must be defined.');
    }

    // force turntable.fm auth options to be set
    if (typeof options.auth    == 'undefined' ||
        typeof options.user_id == 'undefined' ||
        typeof options.room_id == 'undefined') {
        throw new Error('JRDNbot options (auth, user_id, room_id) must be defined.');
    }

    this.options = options;

    this.commands = [];
    this.ttapi    = null;
    this.deck     = null;

    this.init();
};

/**
 * Initializes & starts the bot.
 */
JRDNbot.prototype.init = function() {
    this.ttapi = new ttapi(this.options.auth, this.options.user_id);
    this.subscribe();
    this.loadCommands();

    // initialize the deck
    this.deck = require('./deck.js').setup(this);
};

/***************************
 *       BOT ACTIONS       *
 ***************************/

/**
 * Makes the bot join a given room.
 *
 * @param room_id
 */
JRDNbot.prototype.joinRoom = function(room_id) {
    this.ttapi.roomRegister(room_id);
};

/**
 * Handles chat and private messages.
 *
 * @param message
 * @param user_id
 * @param type
 */
JRDNbot.prototype.say = function(message, user_id, type) {
    switch (type || 'speak') {
        case 'pmmed':
            this.ttapi.pm(message, user_id, function() {
                console.log('pm sent');
            });
            break;
        default:
            this.ttapi.speak(message);
    }
};

/**
 * Make the bot awesome the current song.
 */
JRDNbot.prototype.awesomeSong = function() {
    this.ttapi.vote('up');
};


/****************************
 *   BOT LISTENER METHODS   *
 ****************************/

/**
 * Listen to turntable requests.
 */
JRDNbot.prototype.subscribe = function() {
    this.ttapi.on('ready',          this.onReady.bind(this));
    this.ttapi.on('pmmed',          this.onSpeak.bind(this));
    this.ttapi.on('speak',          this.onSpeak.bind(this));
    //this.ttapi.on('registered',     this.onRegistered.bind(this));
    //this.ttapi.on('registered',     this.onRegisteredFan.bind(this));
    //this.ttapi.on('new_moderator',  this.onNewModerator.bind(this));
    //this.ttapi.on('roomChanged',    this.onRoomInfo.bind(this));
    //this.ttapi.on('roomChanged',    this.initDjList.bind(this));
    //this.ttapi.on('roomChanged',    this.initBanList.bind(this));
    //this.ttapi.on('deregistered',   this.onDeregister.bind(this));
    //this.ttapi.on('add_dj',         this.onAddDj.bind(this));
    //this.ttapi.on('rem_dj',         this.onRemDj.bind(this));
    //this.ttapi.on('snagged',        this.onSnagged.bind(this));
    this.ttapi.on('newsong',        this.onNewSong.bind(this));
    //this.ttapi.on('endsong',        this.onEndSong.bind(this));
    //this.ttapi.on('nosong',         this.onNoSong.bind(this));
    //this.ttapi.on('update_votes',   this.onUpdateVotes.bind(this));
};

/**
 * This gets triggered when the bot was initialized and connected.
 */
JRDNbot.prototype.onReady = function() {
    // join the room
    this.joinRoom(this.options.room_id);
};

/**
 * This gets triggered when anyone PMs the bot or speaks in the chat room.
 *
 * @param data
 */
JRDNbot.prototype.onSpeak = function(data) {
    data = {
        name:    data.name,
        user_id: data.userid,
        text:    data.text,
        type:    data.command
    };

    // don't trigger commands when the bot speaks
    if (data.user_id == this.options.user_id) {
        return;
    }

    // commands must begin with a period
    if ('.' !== data.text.charAt(0)) {
        return;
    }

    var command   = data.text.match(/([^\s]+)/)[0].substr(1),    // get command & remove period
        arguments = data.text.replace('.' + command, '').trim(); // get arguments by removing command from text

    // call the command if it exists
    if (typeof this.commands[command] != 'undefined') {
        this.commands[command].call(this, arguments, data);
    }
};

/**
 * This gets triggered when a new song is played.
 *
 * @param data
 */
JRDNbot.prototype.onNewSong = function(data) {
    var that = this;

    // automatically awesome a song after one and a half minutes
    setTimeout(function() {
        that.awesomeSong();
    }, 90000);
};


/****************************
 *    BOT HELPER METHODS    *
 ****************************/

/**
 * Loads the commands setting the filename as the key and the Command
 * object as the method to call.
 */
JRDNbot.prototype.loadCommands = function () {
    var files = fs.readdirSync(__dirname + '/commands');
    for (i in files) {
        this.commands[files[i].replace('.js', '')] = require('./commands/' + files[i]).Command;
    }
};

module.exports.boot = function(options) {
    var jrdnBot = new JRDNbot(options);
};