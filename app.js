(function() {
  var Bag, Scoreboard, TheBag, app, express, http, io, path, routes, server, status, user, _;

  express = require('express');

  routes = require('./routes');

  user = require('./routes/user');

  http = require('http');

  path = require('path');

  _ = require('underscore');

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
      this.validWords();
      this.grabLetters();
    }

    Bag.prototype.grabLetters = function() {
      var bag;
      bag = "AAABCDDDEEEEFGHHIIIJKKLLLLMMMMNNNNOOOOPPPPPPQRRRRlRSSSTTTTUUUVWWWXYYYZ";
      return this.letters = _.map([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], function() {
        return bag[Math.floor(Math.random() * bag.length)];
      });
    };

    Bag.prototype.validWords = function() {};

    Bag.prototype.wordIsInBag = function(data) {
      var index, l, _i, _len, _ref;
      this.comp = this.letters;
      _ref = data.word;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        l = _ref[_i];
        index = _.indexOf(this.comp, l);
        if (index === -1) return false;
        this.comp.splice(index, 1);
      }
      return true;
    };

    Bag.prototype.isValidWord = function(word) {
      return true;
    };

    return Bag;

  })();

  TheBag = new Bag;

  io.sockets.on('connection', function(socket) {
    io.sockets.emit('status', {
      status: status
    });
    io.sockets.emit('letters', {
      letters: TheBag.letters
    });
    return socket.on('submit', function(data) {
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
      return io.sockets.emit('right', {
        status: 'correct'
      });
    });
  });

}).call(this);
