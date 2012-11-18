socket = io.connect(window.location.hostname)

socket.on('status', (data) ->
  $('#status').html(data.status)
)
socket.on('letters', (data) ->
  $('#letters').html(data.letters)
)
$ ->

  $('#reset').click( ->
    console.log('resetting')
    socket.emit('reset')
  )
