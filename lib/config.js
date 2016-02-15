exports.office_zip = office_zip;
exports.office_station = office_station;
exports.calendar_list = calendar_list;

var OFFICE_ZIP = 8005;
function office_zip() {
    return OFFICE_ZIP;
}

var OFFICE_STATION = 'Zürich, Quellenstrasse';
function office_station() {
    return OFFICE_STATION;
}

function calendar_list() {
    return {
        'tesla': 'liip.ch_2d38393334393236382d383738@resource.calendar.google.com',
        'ada': 'liip.ch_2d3737333137363735383336@resource.calendar.google.com',
        'turing': 'liip.ch_2d313635313838322d373932@resource.calendar.google.com',
        'arena': 'liip.ch_38353937383339302d313434@resource.calendar.google.com',
        'odi': 'stefan.oderbolz@liip.ch',
        'jazz': 'liip.ch_2c864d2ipj657bu5j3e544qg80@group.calendar.google.com',
        'massage': 'liip.ch_k7tumoa3nol4nf1n5878vom3b4@group.calendar.google.com',
        'events': 'liip.ch_0esp4v21fsgm8gtv3bmcis7ghc@group.calendar.google.com'
    };
}
