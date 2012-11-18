(function() {
  var socket;

  socket = io.connect(window.location.hostname);

  socket.on('status', function(data) {
    return $('#status').html(data.status);
  });

  socket.on('letters', function(data) {
    return $('#letters').html(data.letters);
  });

  $(function() {
    return $('#reset').click(function() {
      console.log('resetting');
      return socket.emit('reset');
    });
  });

}).call(this);
