/**
 * The Deck manages all the DJs on deck.
 *
 * @constructor
 */
var Deck = function(zeetoBot) {
    // contains DJ objects with a key of the user_id.
    this.djs = new Array();

    this.dj_scheduled_for_removal = null;

    this.zeetoBot = zeetoBot;

    this.max_dj_plays = zeetoBot.options.max_dj_plays || 0;

    this.max_djs = 0;

    this.subscribe();
};

/**
 * Adds a DJ to the deck.
 *
 * @param user_id
 */
Deck.prototype.addDJ = function(user_id) {
    if (!this.isDJOnDeck(user_id)) {
        this.djs[user_id] = new DJ(this, user_id);
        console.log('Added DJ ' + user_id);
    }
};

/**
 * Removes a DJ from the deck.
 *
 * @param user_id
 */
Deck.prototype.removeDJ = function(user_id) {
    if (this.isDJOnDeck(user_id)) {
        delete this.djs[user_id];
        this.zeetoBot.ttapi.remDj(user_id, function() {
            console.log('Deleted DJ ' + user_id);
        });
    }
};

/**
 * Remove DJ who are scheduled to be deleted.
 */
Deck.prototype.removeScheduledDJ = function() {
    if (null !== this.dj_scheduled_for_removal) {
        this.removeDJ(this.dj_scheduled_for_removal);
        this.dj_scheduled_for_removal = null;
    }
}

/**
 * Returns true if the DJ is already on deck.
 * @param user_id
 */
Deck.prototype.isDJOnDeck = function(user_id) {
    return typeof this.djs[user_id] != 'undefined';
};


/***************************
 *       DECK EVENTS       *
 ***************************/

/**
 * Subscribe to turntable.fm events.
 */
Deck.prototype.subscribe = function() {
    this.zeetoBot.ttapi.on('roomChanged', this.initializeDeck.bind(this));
    this.zeetoBot.ttapi.on('add_dj',      this.onAddDJ.bind(this));
    this.zeetoBot.ttapi.on('rem_dj',      this.onRemoveDJ.bind(this));
    this.zeetoBot.ttapi.on('newsong',     this.onNewSong.bind(this));
    this.zeetoBot.ttapi.on('endsong',     this.onEndSong.bind(this));
};

/**
 * Initialize the deck.
 *
 * @param data
 */
Deck.prototype.initializeDeck = function(data) {
    if ((data.room != null) && (data.room.metadata != null)) {
        // create the dj list
        for (i in data.room.metadata.djs) {
            var user_id = data.room.metadata.djs[i];
            if (this.isDJOnDeck(user_id)) {
                this.djs[user_id].incrementPlays();
            } else {
                this.addDJ(user_id);
            }
        }

        this.max_djs = data.room.metadata.max_djs;
    }
};

/**
 * Triggered when a user takes a dj spot.
 *
 * @param data
 */
Deck.prototype.onAddDJ = function(data) {
    this.addDJ(data.user.pop().userid);
};

/**
 * Triggered when a user leaves a dj spot.
 *
 * @param data
 */
Deck.prototype.onRemoveDJ = function(data) {
    this.removeDJ(data.user.pop().userid);
};

/**
 * Increments the DJ's song play count.
 *
 * @param data
 */
Deck.prototype.onNewSong = function(data) {
    var user_id = data.room.metadata.userid;

    this.removeScheduledDJ();

    if (this.isDJOnDeck(user_id)) {
        // only increment when the dj deck is full.
        if (this.djs.length > this.max_djs.length) {
            this.djs[user_id].incrementPlays();
        }
    }
};

/**
 * Increments the DJ's song play count.
 *
 * @param data
 */
Deck.prototype.onEndSong = function(data) {
    this.removeScheduledDJ();
    console.log(data);
};


/***************************
 *       DJ Object         *
 ***************************/

/**
 * A DJ object contains user info and number of plays.
 *
 * @constructor
 */
var DJ = function(deck, user_id) {
    this.deck               = deck;
    this.user_id            = user_id;
    this.number_of_plays    = 0;
    this.number_of_awesomes = 0;
    this.number_of_lames    = 0;
};

/**
 * Remove a DJ from the Deck.
 */
DJ.prototype.remove = function() {
    this.deck.removeDJ(this.user_id);
};

/**
 * Returns true if DJ has hit his max number of plays.
 *
 * @return {Boolean}
 */
DJ.prototype.hasReachedMaxPlays = function() {
    return this.number_of_plays >= this.deck.max_dj_plays;
};

/**
 * Schedule DJ for removal of the deck after his song is over.
 */
DJ.prototype.scheduleForRemoval = function() {
    this.deck.dj_scheduled_for_removal = this.user_id;
};

/**
 * Increment number of plays.
 */
DJ.prototype.incrementPlays = function() {
    this.number_of_plays++;

    if (this.hasReachedMaxPlays()) {
        console.log('DJ reached max plays!');
        this.scheduleForRemoval();
    }
};

/**
 * Increment number of awesomes.
 */
DJ.prototype.incrementAwesomes = function() {
    this.number_of_awesomes++;
};

/**
 * Increment number of lames.
 */
DJ.prototype.incrementLames = function() {
    this.number_of_lames++;
};

module.exports.setup = function(zeetoBot) {
    return new Deck(zeetoBot);
};