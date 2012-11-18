socket = io.connect(window.location.hostname)

socket.on('status', (data) ->
  $('#status').html(data.status)
)

$('#reset').click( ->
  socket.emit('reset')
)
