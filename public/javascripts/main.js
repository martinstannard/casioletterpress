(function() {
  var socket;

  socket = io.connect(window.location.hostname);

  socket.on('status', function(data) {
    return $('#status').html(data.status);
  });

  console.log($);

  $(function() {
    return $('#reset').click(function() {
      console.log('resetting');
      return socket.emit('reset');
    });
  });

}).call(this);
