// Generated by CoffeeScript 1.3.1
(function() {
  var BASE_URL, Client, crypto, request;

  request = require('request');

  crypto = require('crypto');

  BASE_URL = "https://api.grooveshark.com/ws3.php";

  Client = (function() {

    Client.name = 'Client';

    function Client(key, secret) {
      this.key = key;
      this.secret = secret;
      this.sessionID = null;
      this.authenticated = false;
    }

    Client.prototype.ensureSessionStarted = function(cb) {
      var _this = this;
      if (this.sessionID) {
        return cb(null);
      } else {
        return this.request('startSession', {}, function(err, status, body) {
          if (err) {
            return cb(err);
          }
          _this.sessionID = body.sessionID;
          return cb(null);
        });
      }
    };

    Client.prototype.generateRequestBody = function(method, parameters, cb) {
      var _this = this;
      if (method !== 'startSession') {
        return this.ensureSessionStarted(function(err) {
          if (err) {
            return cb(err);
          }
          return cb(null, {
            method: method,
            parameters: parameters,
            header: {
              wsKey: _this.key,
              sessionID: _this.sessionID
            }
          });
        });
      } else {
        return cb(null, {
          method: method,
          parameters: parameters,
          header: {
            wsKey: this.key
          }
        });
      }
    };

    Client.prototype.urlWithSig = function(body) {
      var sig;
      sig = crypto.createHmac('md5', this.secret).update(JSON.stringify(body)).digest('hex');
      return "" + BASE_URL + "?sig=" + sig;
    };

    Client.prototype.request = function(method, parameters, cb) {
      var _this = this;
      if (parameters == null) {
        parameters = {};
      }
      return this.generateRequestBody(method, parameters, function(err, body) {
        if (err) {
          return cb(err);
        }
        return request({
          uri: _this.urlWithSig(body),
          method: 'POST',
          json: body,
          jar: false
        }, function(err, res, body) {
          if (err) {
            return cb(err);
          }
          if (/^2..$/.test(res.statusCode)) {
            if (body.errors && body.errors.length) {
              return cb(body.errors, res.statusCode, body.result);
            } else {
              return cb(null, res.statusCode, body.result);
            }
          } else {
            return cb(null, res.statusCode, body);
          }
        });
      });
    };

    Client.prototype.authenticate = function(username, password, cb) {
      var token,
        _this = this;
      token = crypto.createHash('md5').update(password).digest("hex");
      return this.request('authenticate', {
        login: username,
        password: token
      }, function(err, status, body) {
        if (err) {
          return cb(err);
        }
        if (body.success && body.UserID) {
          _this.authenticated = true;
        }
        return cb(null, status, body);
      });
    };

    Client.prototype.logout = function(cb) {
      var _this = this;
      this.authenticated = false;
      return this.request('logout', {}, function(err, status, body) {
        if (err) {
          return cb(err);
        }
        return cb(null, status, body);
      });
    };

    return Client;

  })();

  module.exports = Client;

}).call(this);
