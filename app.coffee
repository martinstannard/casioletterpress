
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
    @comp = @letters
    for l in word
      index = _.indexOf(@comp, l)
      return false if index is -1
      @comp.splice index, 1
    true


  isValidWord: (word) ->
    new lazy(fs.createReadStream('/usr/share/dict/words'))
      .lines
      .forEach( (line) ->
        return true if word is line
    )
    false

TheBag = new Bag

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
    io.sockets.emit('right', { status: 'correct' })
    # update scores
    # send score back to player
    # broadcast scoreboard
  )
)
