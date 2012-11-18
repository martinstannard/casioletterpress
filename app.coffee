
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


  addWord: (clientId, word) ->
    if @players[clientId]?
      console.log "pushing word"
      @players[clientId].push word
    else
      console.log "creating client word list"
      @players[clientId] = []
      @players[clientId].push word
    console.log "aading word #{word}"
    console.log @players[clientId]

  playerUsedWord: (clientId, word) ->
    return false unless @players[clientId]
    console.log clientId, word
    _.find(@players[clientId], (w) ->
      console.log w, word
      w is word
    )


class Scoreboard

  constructor: ->
    @scores = {}


  addScore: (clientId, score) ->
    if @scores[clientId]?
      @scores[clientId] += score
    else
      @scores[clientId] = score

  table: ->
    @scores

class Bag

  constructor: ->
    #@validWords()
    @grabLetters()

  grabLetters: ->
    bag = "AAABCDDDEEEEFGHHIIIJKKLLLLMMMMNNNNOOOOPPPPPPQRRRRlRSSSTTTTUUUVWWWXYYYZ"
    @letters = _.map([0..15], ->
      bag[Math.floor(Math.random() * bag.length)]
    )

  validWords: ->
     new lazy(fs.createReadStream('/usr/share/dict/words'))
       .lines
       .forEach( (line) ->
         #console.log(line.toString())
     )


  wordIsInBag: (word) ->
    @comp = _.clone @letters
    for l in word
      index = _.indexOf(@comp, l)
      return false if index is -1
      @comp.splice index, 1
    true


  isValidWord: (word) ->
    return true
    return false if word.length < 3
    new lazy(fs.createReadStream('/usr/share/dict/words'))
      .lines
      .forEach( (line) ->
        #console.log _.trim(line)
        return true if word is line.toString().toUpperCase().replace(/[\n\r]/g, '')
    )
    false

TheBag = new Bag
scoreboard = new Scoreboard
clients = new Clients

io.sockets.on('connection', (socket) ->
  io.sockets.emit('status', { status: status })
  io.sockets.emit('letters', { letters: TheBag.letters })
  # note the use of io.sockets to emit but socket.on to listen
  socket.on('word', (data) ->
    console.log 'submitting', data
    # is this in TheBag?
    unless TheBag.wordIsInBag data
      console.log "word not in bag"
      io.sockets.emit('wrong', { status: 'not in bag' })
      return
    unless TheBag.isValidWord data
      console.log "word not valid"
      io.sockets.emit('wrong', { status: 'not valid' })
      return
    if clients.playerUsedWord(socket.id, data)
      console.log "word already used"
      io.sockets.emit('wrong', { status: 'word already used' })
      return
    clients.addWord(socket.Id, data)
    io.sockets.emit('right', { status: 'correct' })
    # update scores
    scoreboard.addScore socket.id, data.length
    console.log scoreboard
    #io.sockets.broadcast('scoreboard', scoreboard.scores)
  )
)
