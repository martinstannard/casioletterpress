(function() {
  var Bag, Clients, Scoreboard, TheBag, app, clients, express, fs, http, io, lazy, path, routes, scoreboard, server, spell, status, user, _;

  express = require('express');

  routes = require('./routes');

  user = require('./routes/user');

  http = require('http');

  path = require('path');

  spell = require('lazy');

  _ = require('underscore');

  lazy = require("lazy");

  fs = require("fs");

  app = express();

  app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    return app.use(express.static(path.join(__dirname, 'public')));
  });

  app.configure('development', function() {
    return app.use(express.errorHandler());
  });

  app.get('/', routes.index);

  app.get('/users', user.list);

  server = http.createServer(app);

  io = require('socket.io').listen(server);

  server.listen(app.get('port'), function() {
    return console.log("Express server listening on port " + app.get('port'));
  });

  status = "All is well.";

  Clients = (function() {

    function Clients() {
      this.players = {};
    }

    Clients.prototype.addWord = function(clientId, word) {
      if (this.players[clientId] != null) {
        console.log("pushing word");
        this.players[clientId].push(word);
      } else {
        console.log("creating client word list");
        this.players[clientId] = [];
        this.players[clientId].push(word);
      }
      console.log("aading word " + word);
      return console.log(this.players[clientId]);
    };

    Clients.prototype.playerUsedWord = function(clientId, word) {
      if (!this.players[clientId]) return false;
      console.log(clientId, word);
      return _.find(this.players[clientId], function(w) {
        console.log(w, word);
        return w === word;
      });
    };

    return Clients;

  })();

  Scoreboard = (function() {

    function Scoreboard() {
      this.scores = {};
    }

    Scoreboard.prototype.addScore = function(clientId, score) {
      if (this.scores[clientId] != null) {
        return this.scores[clientId] += score;
      } else {
        return this.scores[clientId] = score;
      }
    };

    Scoreboard.prototype.table = function() {
      return this.scores;
    };

    return Scoreboard;

  })();

  Bag = (function() {

    function Bag() {
      this.grabLetters();
    }

    Bag.prototype.grabLetters = function() {
      var bag;
      bag = "AAABCDDDEEEEFGHHIIIJKKLLLLMMMMNNNNOOOOPPPPPPQRRRRlRSSSTTTTUUUVWWWXYYYZ";
      return this.letters = _.map([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], function() {
        return bag[Math.floor(Math.random() * bag.length)];
      });
    };

    Bag.prototype.validWords = function() {
      return new lazy(fs.createReadStream('/usr/share/dict/words')).lines.forEach(function(line) {});
    };

    Bag.prototype.wordIsInBag = function(word) {
      var index, l, _i, _len;
      this.comp = _.clone(this.letters);
      for (_i = 0, _len = word.length; _i < _len; _i++) {
        l = word[_i];
        index = _.indexOf(this.comp, l);
        if (index === -1) return false;
        this.comp.splice(index, 1);
      }
      return true;
    };

    Bag.prototype.isValidWord = function(word) {
      if (word.length < 3) return false;
      console.log("isValidWord " + word);
      new lazy(fs.createReadStream('/usr/share/dict/words')).lines.forEach(function(line) {
        console.log(word, line.toString().toUpperCase().slice(0, -1));
        if (word === line.toString().toUpperCase().replace(/[\n\r]/g, '')) {
          return true;
        }
      });
      return false;
    };

    return Bag;

  })();

  TheBag = new Bag;

  scoreboard = new Scoreboard;

  clients = new Clients;

  io.sockets.on('connection', function(socket) {
    io.sockets.emit('status', {
      status: status
    });
    io.sockets.emit('letters', {
      letters: TheBag.letters
    });
    return socket.on('word', function(data) {
      console.log('submitting', data);
      if (!TheBag.wordIsInBag(data)) {
        console.log("word not in bag");
        io.sockets.emit('wrong', {
          status: 'not in bag'
        });
        return;
      }
      if (!TheBag.isValidWord(data)) {
        console.log("word not valid");
        io.sockets.emit('wrong', {
          status: 'not valid'
        });
        return;
      }
      if (clients.playerUsedWord(socket.id, data)) {
        console.log("word already used");
        io.sockets.emit('wrong', {
          status: 'word already used'
        });
        return;
      }
      clients.addWord(socket.Id, data);
      io.sockets.emit('right', {
        status: 'correct'
      });
      scoreboard.addScore(socket.id, data.length);
      return console.log(scoreboard);
    });
  });

}).call(this);
