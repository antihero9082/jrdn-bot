var request = require('request')
  , xml2js  = require('xml2js')
  , parser  = new xml2js.Parser()
;

exports.Command = function(location, data) {
    var that = this;

    if (location == '') {
        location = 92101;
    }

    request('http://www.google.com/ig/api?weather=' + encodeURIComponent(location), function cb(error, response, body) {
        try  {
            parser.parseString(body, function(err, result) {
                if (result.weather.forecast_information != null) {
                    try {
                        var rp = 'The weather in '
                            + result.weather.forecast_information.city['@'].data
                            + ' is ' + result.weather.current_conditions.temp_f["@"].data
                            + '°F and ' + result.weather.current_conditions.condition["@"].data
                            + ' (' + result.weather.current_conditions.wind_condition["@"].data
                            + ', ' + result.weather.current_conditions.humidity["@"].data
                            + ').';
                        that.say(rp, data.user_id, data.type);
                    } catch (e) {
                        that.say('An error occurred.', data.user_id, data.type);
                    }
                } else {
                    that.say('Sorry, I can\'t find that location.', data.user_id, data.type);
                }
            });
        } catch (e) {
            that.say('An error occurred.', data.user_id, data.type);
        }
    });
};