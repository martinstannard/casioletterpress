
# Module dependencies.

express = require('express')
routes = require('./routes')
user = require('./routes/user')
http = require('http')
path = require('path')
spell = require('lazy')
_ = require('underscore')
lazy = require("lazy")
fs = require("fs")

app = express()

app.configure( ->
  app.set('port', process.env.PORT || 3000)
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(express.favicon())
  app.use(express.logger('dev'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(path.join(__dirname, 'public')))
)

app.configure('development', ->
  app.use(express.errorHandler())
)

app.get('/', routes.index)
app.get('/users', user.list)

server = http.createServer(app)

io = require('socket.io').listen(server)

server.listen(app.get('port'), ->
  console.log("Express server listening on port " + app.get('port'))
)


status = "All is well."

class Clients

  constructor: ->
    @players = {}


  clear: ->
    console.log "clearing"
    for id, words of @players
      console.log id, words
      @players[id] = []

  addWord: (clientId, word) ->
    if @players[clientId]?
      @players[clientId].push word
    else
      @players[clientId] = []
      @players[clientId].push word
    console.log "aading word #{word}"
    console.log @players[clientId]

  playerUsedWord: (clientId, word) ->
    return false unless @players[clientId]
    console.log clientId, word
    _.find(@players[clientId], (w) ->
      w is word
    )

  playerWords: (clientId) ->
    @players[clientId].reverse()


class Scoreboard

  constructor: ->
    @scores = {}


  addScore: (clientId, score) ->
    if @scores[clientId]?
      @scores[clientId] += score * 2
    else
      @scores[clientId] = score * 2


  exists: (clientId) ->
    @scores[clientId]?


class Bag

  constructor: ->
    @grabLetters()
    @getDictWords(@setDictWords)

  grabLetters: ->
    bag = "AAABCDDDEEEEFGHHIIIJKKLLLLMMMMNNNNOOOOPPPPPPQRRRRRSSSTTTTUUUVWWWXYYYZ"
    @letters = _.map([0..15], ->
      bag[Math.floor(Math.random() * bag.length)]
    )

  getDictWords: (callback) ->
    @dict = []
    new lazy(fs.createReadStream('/usr/share/dict/words'))
      .lines
      .map( (line) =>
        line.toString().toUpperCase()[0..-1]
    ).join(callback)

  setDictWords: (dict) =>
    @dict = dict
    console.log "@dict size #{@dict.length}"

  wordIsInBag: (word) ->
    @comp = _.clone @letters
    for l in word
      index = _.indexOf(@comp, l)
      return false if index is -1
      @comp.splice index, 1
    true


  isValidWord: (word) ->
    return false if word.length < 3
    _.find(@dict, (w) ->
      word is w
    )

TheBag = new Bag
scoreboard = new Scoreboard
clients = new Clients

io.sockets.on('connection', (socket) ->
  unless scoreboard.exists(socket.id)
    socket.emit('letters', { letters: TheBag.letters })
    socket.emit('youare', socket.id)
  # note the use of io.sockets to emit but socket.on to listen
  socket.on('word', (data) ->
    console.log 'submitting', data
    # is this in TheBag?
    unless TheBag.wordIsInBag data
      console.log "word not in bag"
      socket.emit('wrong', { status: 'not in bag' })
      return
    isValid = TheBag.isValidWord data
    console.log "isValid #{isValid}"
    unless isValid
      console.log "word not valid"
      socket.emit('wrong', { status: 'not valid' })
      return
    if clients.playerUsedWord(socket.id, data)
      console.log "word already used"
      socket.emit('wrong', { status: 'word already used' })
      return
    clients.addWord(socket.id, data)
    socket.emit('right', { status: 'correct', words: clients.playerWords(socket.id) })
    # update scores
    scoreboard.addScore socket.id, data.length
    console.log scoreboard
    io.sockets.emit('scoreboard', scoreboard.scores)
  )
)

setInterval( =>
    TheBag = new Bag
    clients.clear()
    io.sockets.emit('letters', { letters: TheBag.letters })
, 30000)


