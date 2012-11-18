(function() {
  var LetterPressCalculator;

  LetterPressCalculator = (function() {

    function LetterPressCalculator(el, socket) {
      this.el = el;
      this.socket = socket;
      this.screenEl = this.el.find('section.screen');
      this.correctEl = this.screenEl.find(".light.correct");
      this.wrongEl = this.screenEl.find(".light.wrong");
      this.screenTextEl = this.screenEl.find('p');
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
      this.socket.on('letters', function(data) {
        _this._buildLetterButtons(data.letters);
        return _this._initLetterHandlers();
      });
      this.socket.on('wrong', function() {
        return _this._wrongLightOn();
      });
      this.socket.on('right', function() {
        return _this._correctLightOn();
      });
      this.socket.on('scoreboard', function(scores) {
        return console.log(scores);
      });
      return this.socket.on('youare', function(id) {
        return console.log(id);
      });
    };

    LetterPressCalculator.prototype._initLetterHandlers = function() {
      var _this = this;
      return this.lettersEl.find(".button").click(function(e) {
        if (!$(e.currentTarget).hasClass("on")) {
          _this._appendScreenText($(e.currentTarget).data("letter"));
          return $(e.currentTarget).addClass("on");
        }
      });
    };

    LetterPressCalculator.prototype._initCommandHandlers = function() {
      var _this = this;
      this.commandsEl.find('.send').click(function() {
        return _this._send();
      });
      this.commandsEl.find('.delete').click(function() {
        return _this._deleteScreenText();
      });
      return this.commandsEl.find('.clear').click(function() {
        return _this._clearScreenText();
      });
    };

    LetterPressCalculator.prototype._appendScreenText = function(str) {
      return this.screenTextEl.text("" + (this.screenText()) + str);
    };

    LetterPressCalculator.prototype._deleteScreenText = function() {
      var char;
      this._lightsOff();
      char = this.screenText().slice(-1);
      this.screenTextEl.text(this.screenText().slice(0, -1));
      return this.lettersEl.find(".button.on[data-letter='" + char + "']").last().removeClass("on");
    };

    LetterPressCalculator.prototype._clearScreenText = function() {
      this._lightsOff();
      this.screenTextEl.text("");
      return this.lettersEl.find(".button").removeClass("on");
    };

    LetterPressCalculator.prototype._correctLightOn = function() {
      this.correctEl.addClass("on");
      return this.wrongEl.removeClass("on");
    };

    LetterPressCalculator.prototype._wrongLightOn = function() {
      this.correctEl.removeClass("on");
      return this.wrongEl.addClass("on");
    };

    LetterPressCalculator.prototype._lightsOff = function() {
      this.correctEl.removeClass("on");
      return this.wrongEl.removeClass("on");
    };

    LetterPressCalculator.prototype._scoreboard = function() {};

    LetterPressCalculator.prototype._buildLetterButtons = function(letters) {
      var rowTemplate;
      this.lettersEl.find(".row").remove();
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
      this._lightsOff();
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
    return true;
  });

}).call(this);
