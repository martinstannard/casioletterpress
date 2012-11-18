(function() {
  var socket;

  socket = io.connect(window.location.hostname);

  socket.on('status', function(data) {
    return $('#status').html(data.status);
  });

  $('#reset').click(function() {
    return socket.emit('reset');
  });

}).call(this);
