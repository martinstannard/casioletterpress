(function() {
  var app, express, http, io, path, routes, server, status, user;

  express = require('express');

  routes = require('./routes');

  user = require('./routes/user');

  http = require('http');

  path = require('path');

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

  io.sockets.on('connection', function(socket) {
    io.sockets.emit('status', {
      status: status
    });
    return socket.on('reset', function(data) {
      status = "War is imminent!";
      return io.sockets.emit('status', {
        status: status
      });
    });
  });

}).call(this);
