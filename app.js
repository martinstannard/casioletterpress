(function() {
  var Bag, Clients, Scoreboard, TheBag, app, clients, express, fs, http, io, lazy, path, routes, scoreboard, server, spell, status, user, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    _this = this;

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

    Clients.prototype.clear = function() {
      var id, words, _ref, _results;
      console.log("clearing");
      _ref = this.players;
      _results = [];
      for (id in _ref) {
        words = _ref[id];
        console.log(id, words);
        _results.push(this.players[id] = []);
      }
      return _results;
    };

    Clients.prototype.addWord = function(clientId, word) {
      if (this.players[clientId] != null) {
        this.players[clientId].push(word);
      } else {
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
        return w === word;
      });
    };

    Clients.prototype.playerWords = function(clientId) {
      return this.players[clientId].reverse();
    };

    return Clients;

  })();

  Scoreboard = (function() {

    function Scoreboard() {
      this.scores = {};
    }

    Scoreboard.prototype.addScore = function(clientId, score) {
      if (this.scores[clientId] != null) {
        return this.scores[clientId] += score * 2;
      } else {
        return this.scores[clientId] = score * 2;
      }
    };

    Scoreboard.prototype.exists = function(clientId) {
      return this.scores[clientId] != null;
    };

    return Scoreboard;

  })();

  Bag = (function() {

    function Bag() {
      this.setDictWords = __bind(this.setDictWords, this);      this.grabLetters();
      this.getDictWords(this.setDictWords);
    }

    Bag.prototype.grabLetters = function() {
      var bag;
      bag = "AAABCDDDEEEEFGHHIIIJKKLLLLMMMMNNNNOOOOPPPPPPQRRRRRSSSTTTTUUUVWWWXYYYZ";
      return this.letters = _.map([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], function() {
        return bag[Math.floor(Math.random() * bag.length)];
      });
    };

    Bag.prototype.getDictWords = function(callback) {
      var _this = this;
      this.dict = [];
      return new lazy(fs.createReadStream('public/words')).lines.map(function(line) {
        return line.toString().toUpperCase().slice(0);
      }).join(callback);
    };

    Bag.prototype.setDictWords = function(dict) {
      this.dict = dict;
      return console.log("@dict size " + this.dict.length);
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
      return _.find(this.dict, function(w) {
        return word === w;
      });
    };

    return Bag;

  })();

  TheBag = new Bag;

  scoreboard = new Scoreboard;

  clients = new Clients;

  io.sockets.on('connection', function(socket) {
    if (!scoreboard.exists(socket.id)) {
      socket.emit('letters', {
        letters: TheBag.letters
      });
      socket.emit('youare', socket.id);
      socket.emit('scoreboard', scoreboard.scores);
    }
    return socket.on('word', function(data) {
      var isValid;
      console.log('submitting', data);
      if (!TheBag.wordIsInBag(data)) {
        console.log("word not in bag");
        socket.emit('wrong', {
          status: 'not in bag'
        });
        return;
      }
      isValid = TheBag.isValidWord(data);
      console.log("isValid " + isValid);
      if (!isValid) {
        console.log("word not valid");
        socket.emit('wrong', {
          status: 'not valid'
        });
        return;
      }
      if (clients.playerUsedWord(socket.id, data)) {
        console.log("word already used");
        socket.emit('wrong', {
          status: 'word already used'
        });
        return;
      }
      clients.addWord(socket.id, data);
      socket.emit('right', {
        status: 'correct',
        words: clients.playerWords(socket.id)
      });
      scoreboard.addScore(socket.id, data.length);
      console.log(scoreboard);
      return io.sockets.emit('scoreboard', scoreboard.scores);
    });
  });

  setInterval(function() {
    TheBag = new Bag;
    clients.clear();
    return io.sockets.emit('letters', {
      letters: TheBag.letters
    });
  }, 30000);

}).call(this);
