(function() {
  var LetterPressCalculator;

  LetterPressCalculator = (function() {

    function LetterPressCalculator(el, socket) {
      this.el = el;
      this.socket = socket;
      this.screenTextEl = this.el.find('section.screen p');
      this.commandsEl = this.el.find('section.commands');
      this.lettersEl = this.el.find('section.letters');
      this._initLetterHandlers();
      this._initCommandHandlers();
    }

    LetterPressCalculator.prototype.screenText = function() {
      return $.trim(this.screenTextEl.text());
    };

    LetterPressCalculator.prototype._initLetterHandlers = function() {
      var _this = this;
      return this.lettersEl.find(".button").click(function(e) {
        return _this._appendScreenText($(e.currentTarget).data("letter"));
      });
    };

    LetterPressCalculator.prototype._initCommandHandlers = function() {
      var _this = this;
      return this.commandsEl.find('.send').click(function() {
        return _this._send();
      });
    };

    LetterPressCalculator.prototype._appendScreenText = function(str) {
      return this.screenTextEl.text("" + (this.screenText()) + str);
    };

    LetterPressCalculator.prototype._send = function() {
      if (this.screenText().length > 0) {
        return this.socket.emit('word', this.screenText());
      }
    };

    return LetterPressCalculator;

  })();

  $(function() {
    var socket;
    socket = io.connect(window.location.hostname);
    socket.on('status', function(data) {
      return $('#status').html(data.status);
    });
    socket.on('letters', function(data) {
      return $('#letters').html(data.letters);
    });
    $('#reset').click(function() {
      console.log('resetting');
      return socket.emit('reset');
    });
    return new LetterPressCalculator($('article'), socket);
  });

}).call(this);
