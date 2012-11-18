

class LetterPressCalculator
  constructor: (@el, @socket) ->
    @screenTextEl = @el.find('section.screen p')
    @commandsEl = @el.find('section.commands')
    @lettersEl = @el.find('section.letters')

    @_initLetterHandlers()
    @_initCommandHandlers()

  screenText:->
    $.trim @screenTextEl.text()

  # Private Methods
  _initLetterHandlers: ->
    @lettersEl.find(".button").click (e) =>
      @_appendScreenText $(e.currentTarget).data("letter")

  _initCommandHandlers: ->
    @commandsEl.find('.send').click =>
      @_send()

  _appendScreenText: (str) ->
    @screenTextEl.text("#{@screenText()}#{str}")

  _send: ->
    if @screenText().length > 0
      @socket.emit('word', @screenText())

$ ->
  socket = io.connect(window.location.hostname)

  socket.on('status', (data) ->
    $('#status').html(data.status)
  )
  socket.on('letters', (data) ->
    $('#letters').html(data.letters)
  )

  $('#reset').click( ->
    console.log('resetting')
    socket.emit('reset')
  )

  new LetterPressCalculator($('article'), socket)