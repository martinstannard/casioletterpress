// Generated by CoffeeScript 1.3.1
var LetterPressCalculator;

LetterPressCalculator = (function() {

  LetterPressCalculator.name = 'LetterPressCalculator';

  function LetterPressCalculator(el, socket) {
    this.el = el;
    this.socket = socket;
    this.screenTextEl = this.el.find('section.screen p');
    this.commandsEl = this.el.find('section.commands');
    this.lettersEl = this.el.find('section.letters');
    this._initSocketHandlers();
    this._initCommandHandlers();
  }

  LetterPressCalculator.prototype.screenText = function() {
    return $.trim(this.screenTextEl.text());
  };

  LetterPressCalculator.prototype._initSocketHandlers = function() {
    var _this = this;
    return this.socket.on('letters', function(data) {
      _this._buildLetterButtons(data.letters);
      return _this._initLetterHandlers();
    });
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

  LetterPressCalculator.prototype._buildLetterButtons = function(letters) {
    var rowTemplate;
    rowTemplate = _.template("<div class='row cf'>\n  <div class='button' data-letter='<%= list[0] %>'><%= list[0] %></div>\n  <div class='button' data-letter='<%= list[1] %>'>\n    <%= list[1] %>\n  </div>\n  <div class='button' data-letter='<%= list[2] %>'>\n    <%= list[2] %>\n  </div>\n  <div class='button' data-letter='<%= list[3] %>'>\n    <%= list[3] %>\n  </div>\n</div>");
    this.lettersEl.append(rowTemplate({
      list: letters.slice(0, 4)
    }));
    this.lettersEl.append(rowTemplate({
      list: letters.slice(4, 8)
    }));
    this.lettersEl.append(rowTemplate({
      list: letters.slice(8, 12)
    }));
    return this.lettersEl.append(rowTemplate({
      list: letters.slice(12, 16)
    }));
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
  new LetterPressCalculator($('article'), socket);
  return socket.on('letters', function(data) {
    return $('#letters').html(data.letters);
  });
});
