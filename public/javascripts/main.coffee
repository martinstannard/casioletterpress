

class LetterPressCalculator
  constructor: (@el, @socket) ->
    @id = null
    @screenEl = @el.find('section.screen')
    @correctEl = @screenEl.find(".light.correct")
    @wrongEl = @screenEl.find(".light.wrong")
    @screenTextEl = @screenEl.find('p')
    @commandsEl = @el.find('section.commands')
    @lettersEl = @el.find('section.letters')

    @_initSocketHandlers()
    @_initCommandHandlers()

  screenText:->
    $.trim @screenTextEl.text()

  # Private Methods
  _initSocketHandlers: ->
    @socket.on 'letters', (data) =>
      @_buildLetterButtons(data.letters)
      @_clearScreenText()
      @_lightsOff()
      @_initKeyboardEvents(data.letters)
      @_initLetterHandlers()
      @_clearWords()

    @socket.on 'wrong', => @_wrongLightOn()

    @socket.on 'right', (status)=>
      @_correctLightOn()
      @_clearScreenText()
      @_updateWordList(status.words)

    @socket.on 'scoreboard', (scores) =>
      @_updateLeaderBoard(scores)

    @socket.on 'youare', (id) =>
      @id = id

    @socket.on 'tick', (seconds) =>
      @_updateTimer(seconds)

  _initLetterHandlers: ->
    @lettersEl.find(".button").click (e) =>
      unless $(e.currentTarget).hasClass("on")
        @_appendScreenText $(e.currentTarget).data("letter")
        $(e.currentTarget).addClass("on")

  _initCommandHandlers: ->
    @commandsEl.find('.send').click =>
      @_send()
    @commandsEl.find('.delete').click =>
      @_deleteScreenText()
    @commandsEl.find('.clear').click =>
      @_clearScreenText()

  _appendScreenText: (str) ->
    @screenTextEl.text("#{@screenText()}#{str}")

  _deleteScreenText: ->
    @_lightsOff()
    char = @screenText().slice(-1)
    @screenTextEl.text(@screenText().slice(0,-1))
    @lettersEl.find(".button.on[data-letter='#{char}']").last().removeClass("on")

  _clearScreenText: ->
    @screenTextEl.text("")
    @lettersEl.find(".button").removeClass("on")

  _correctLightOn: ->
    @correctEl.addClass("on")
    @wrongEl.removeClass("on")

  _wrongLightOn: ->
    @correctEl.removeClass("on")
    @wrongEl.addClass("on")

  _lightsOff: ->
    @correctEl.removeClass("on")
    @wrongEl.removeClass("on")

  _updateLeaderBoard: (scores) ->
    list = $('.leaderboard ol')
    list.find('li').remove()
    for playerID, score of scores
      if @id is playerID
        list.append """
          <li class='you'>
            <span>You</span> #{score}
          </li>
        """
      else
        list.append("<li>#{score}</li>")

  _updateWordList: (words) ->
    @_clearWords()
    list = $('.words ol')
    for word in words
      list.append("<li>#{word}</li>")

  _clearWords: ->
    list = $('.words ol')
    list.find('li').remove()

  _updateTimer: (seconds) ->
    $('.timer').text(seconds)

  _buildLetterButtons: (letters) ->
    @lettersEl.find(".row").remove()
    rowTemplate = _.template """
      <div class='row cf'>
        <div class='button' data-letter='<%= list[0] %>'><%= list[0] %></div>
        <div class='button' data-letter='<%= list[1] %>'>
          <%= list[1] %>
        </div>
        <div class='button' data-letter='<%= list[2] %>'>
          <%= list[2] %>
        </div>
        <div class='button' data-letter='<%= list[3] %>'>
          <%= list[3] %>
        </div>
      </div>
    """

    @lettersEl.append rowTemplate(list: letters[0..3])
    @lettersEl.append rowTemplate(list: letters[4..7])
    @lettersEl.append rowTemplate(list: letters[8..11])
    @lettersEl.append rowTemplate(list: letters[12..15])

  _initKeyboardEvents: (letters) ->
    for letter in _.uniq(letters)
      do (letter) =>
        key.unbind letter
        key letter, =>
          selector = ".button[data-letter='#{letter}']:not(.on):first"
          console.log @lettersEl.find(selector).get(0)
          @lettersEl.find(selector).get(0).click()

    for keyName in ['enter', 'backspace', 'esc', 'ctrl+backspace']
      key.unbind keyName
    key 'enter', => @commandsEl.find('.send').click()
    key 'backspace', =>
       @commandsEl.find('.delete').click()
       off
    key 'esc', => @commandsEl.find('.clear').click()
    key 'ctrl+backspace', =>
      @commandsEl.find('.clear').click()
      off

  _send: ->
    @_lightsOff()
    if @screenText().length > 0
      @socket.emit('word', @screenText())

$ ->
  socket = io.connect(window.location.hostname)
  new LetterPressCalculator($('article'), socket)
  true
