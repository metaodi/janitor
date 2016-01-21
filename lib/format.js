exports.colEntry = colEntry;
exports.uptime = uptime;

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
        output += '- ' + col.date + ': ' + colType + "\n";
    } else {
        output += '- ' + col.zip + ': ' + colType + "\n";
    }

    return output;
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

