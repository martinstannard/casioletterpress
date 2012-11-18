socket = io.connect(window.location.hostname)

socket.on('status', (data) ->
  $('#status').html(data.status)
)
console.log($)
$ ->

  $('#reset').click( ->
    console.log('resetting')
    socket.emit('reset')
  )
