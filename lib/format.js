var _ = require('underscore');
var Moment = require('moment-timezone');

exports.colEntry = colEntry;
exports.uptime = uptime;
exports.connEntry = connEntry;
exports.stationEntry = stationEntry;
exports.calendarEntry = calendarEntry;

function colEntry(col, mode) {
    var typeName = {
        'paper': 'Paper :newspaper:',
        'cardboard': 'Cardboard :package:',
        'etram': 'E-Tram :electric_plug: :railway_car:',
        'organic': 'Organic :herb:',
        'waste': 'Waste :truck:',
        'cargotram': 'Cargo-Tram :railway_car:'
    };
    var colType = col.type.charAt(0).toUpperCase() + col.type.slice(1);
    if (col.type in typeName) {
        colType = typeName[col.type];
    }

    var output = '';
    if (mode === 'date') {
        output += '- ' + Moment(col.date).tz('Europe/Zurich').format('DD.MM.YYYY') + ': ' + colType + "\n";
    } else {
        output += '- ' + col.zip + ': ' + colType + "\n";
    }

    return output;
}

function connEntry(conn) {
    var matchDuration = conn.duration.match(/(\d\d)d(.*)/);
    var duration = Moment.duration(matchDuration[1].trim() + '.' + matchDuration[2]);

    var minutes = duration.minutes();
    var hours = duration.hours();

    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (hours < 10) {
        hours = '0' + hours;
    }

    var output = '*' + conn.from.station.name + ' - ' + conn.to.station.name + ' (duration: ' + hours + ':' + minutes + 'h)*' + "\n";
    _.each(conn.sections, function (section) {
        // do not display "walking" sections
        if (!section.journey) {
            return;
        }
        var transportName = '_' + section.journey.name.replace(section.journey.number, '').trim() + '_';
        var depTime = Moment(section.departure.departure).tz('Europe/Zurich').format('HH:mm');
        var depPlatform = '';
        if (section.departure.platform) {
            depPlatform = ' | platform *' + section.departure.platform + '*';
        }
        output += ':arrow_upper_right: ' + depTime + ' ' + section.departure.station.name + ' | ' + transportName + depPlatform + "\n";
        
        var arrTime = Moment(section.arrival.arrival).tz('Europe/Zurich').format('HH:mm');
        var arrPlatform = '';
        if (section.arrival.platform) {
            arrPlatform = ' | platform *' + section.arrival.platform + '*';
        }
        output += ':arrow_lower_right: ' + arrTime + ' ' + section.arrival.station.name + arrPlatform + "\n";
        output += "\n";
    });
    return output;
}

function stationEntry(conn) {
    var minutes = Math.round((conn.stop.departureTimestamp - (Date.now() / 1000)) / 60);
    if (minutes >= 0) {
        return minutes + "' " + conn.name + ': ' + conn.to + "\n"; 
    } else {
        return '';
    }
}

function calendarEntry(event, timeOnly) {
    var start = event.start.dateTime || event.start.date;
    var end = event.end.dateTime || event.end.date;
    var format = 'DD.MM.YYYY HH:mm';

    if (timeOnly) {
        format = 'HH:mm';
    }

    start = Moment(start).tz('Europe/Zurich').format(format);
    end = Moment(end).tz('Europe/Zurich').format('HH:mm');
    return start + ' - ' + end + ' ' + event.summary + "\n";
}

function uptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime !== 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}

