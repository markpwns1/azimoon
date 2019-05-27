var coordinates;
var day;
var dayOffset = 0; // -1 = yesterday, 0 = today, 1 = tomorrow

var paused = false;

function makeAnglePositive(deg) {
    var x = deg;
    while (x < 0) {
        x += 360;
    }
    return x;
}

function degToCompass(deg) {
    deg = makeAnglePositive(deg);
    var val = Math.round((deg) / 45);
    var arr = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return arr[(val % 8)];
}

function getMoonIcon(phase) {
    var arr = "0ABCDEFGHIJKLM@NOPQRSTUVWXYZ".toLowerCase().split("");
    return arr[Math.floor(phase * arr.length)];
}

// rounds number to place decimal places
function round(number, place) {
    var p = Math.pow(10, place);
    return Math.round(number * p) / p;
}

function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function formatTime(time) {
    return pad(time.getHours(), 2) + ":" + pad(time.getMinutes(), 2);
}

function phaseToText(phase) {
    if (phase < 0.02) return "New Moon";
    if (phase < 0.26) return "Waxing Crescent";
    if (phase < 0.49) return "Waxing Gibbous";
    if (phase < 0.52) return "Full Moon";
    if (phase < 0.76) return "Waning Gibbous";
    if (phase < 0.99) return "Last Quarter";
    return "New Moon";
}

function subtractDate(a, b) {
    var res = Math.abs(a - b) / 1000;
    return {
        minutes: Math.floor(res / 60) % 60,
        hours: Math.floor(res / 3600) % 24,
        toString: function () {
            return this.hours + ":" + this.minutes;
        }
    };
}

function getAtTime(time, func, property, desc) {
    if(desc == null) desc = "° S of E";
    var offset = property == "altitude" ? 0 : -270;
    var properties = SunCalc[func](time, coordinates.latitude, coordinates.longitude);
    return formatTime(time) + " at " + makeAnglePositive(Math.round((properties[property] * 180 / Math.PI)) + offset) + desc;
}

function getMoonNoon(moonTimeStats) {
    var min = Math.abs(moonTimeStats.rise);
    var max = Math.abs(moonTimeStats.set);
    var res = min + Math.abs(max - min) / 2;
    return new Date(res);
}

function disableIfPassed(selector, time) {
    if (Math.abs(new Date()) > Math.abs(time)) $(selector).addClass("disabled");
}

function update() {
    if(paused) return;

    day = new Date();
    day.setDate(day.getDate() + dayOffset);

    $(".disabled").removeClass("disabled");

    switch(dayOffset) {
        case -1: $("#yesterday-button").addClass("disabled"); break;
        case 0: $("#today-button").addClass("disabled"); break;
        case 1: $("#tomorrow-button").addClass("disabled"); break;
    }

    var sunTimes = SunCalc.getTimes(day, coordinates.latitude, coordinates.longitude);

    var moonIllumination = SunCalc.getMoonIllumination(day);
    var moonPosition = SunCalc.getMoonPosition(day, coordinates.latitude, coordinates.longitude);
    var moonTimes = SunCalc.getMoonTimes(day, coordinates.latitude, coordinates.longitude);

    var illumination = round(moonIllumination.fraction * 100, 2);
    var dir = degToCompass((moonPosition.azimuth * 180 / Math.PI) - 180);
    var altitude = round(moonPosition.altitude * 180 / Math.PI, 2);
    var moonNoon = getMoonNoon(moonTimes);

    disableIfPassed("#moon-rise", moonTimes.rise);
    disableIfPassed("#moon-noon", moonNoon);
    disableIfPassed("#moon-set", moonTimes.set);
    disableIfPassed("#sun-rise", sunTimes.sunrise);
    disableIfPassed("#sun-noon", sunTimes.solarNoon);
    disableIfPassed("#sun-set", sunTimes.sunset);
    disableIfPassed("#sun-length", sunTimes.sunset);
    disableIfPassed("#day-progress", sunTimes.sunset);
    disableIfPassed("#morning-golden-hour", sunTimes.goldenHourEnd);
    disableIfPassed("#night-golden-hour", sunTimes.goldenHour);
    disableIfPassed("#golden-hours", sunTimes.goldenHour);

    if (altitude <= 0) {
        $("#moon-direction").addClass("disabled");
        $("#moon-altitude").addClass("disabled");
    }

    $("#moon-icon").text(getMoonIcon(moonIllumination.phase));
    $("#moon-illum").text("Illumination: " + illumination + "%");
    $("#moon-phase").text("Phase: " + phaseToText(moonIllumination.phase));

    if(moonTimes.rise == null) {
        $("#moon-rise").text("Rise: None Today");
        $("#moon-rise").addClass("disabled");
    }else{
        $("#moon-rise").text("Rise: " + getAtTime(moonTimes.rise, "getMoonPosition", "azimuth"));
    }

    if(isNaN(moonNoon.getHours())) {
        $("#moon-noon").text("Noon: None Today");
        $("#moon-noon").addClass("disabled");
    }else{
        $("#moon-noon").text("Noon: " + getAtTime(moonNoon, "getMoonPosition", "altitude", "° alt."));
    }

    if(moonTimes.set == null) {
        $("#moon-set").text("Set: None Today");
        $("#moon-set").addClass("disabled");
    }else{
        $("#moon-set").text("Set: " + getAtTime(moonTimes.set, "getMoonPosition", "azimuth"));
    }


    $("#moon-direction").text("Direction: " + dir + " (" + makeAnglePositive(Math.round((moonPosition.azimuth * 180 / Math.PI)) - 270) + "° S of E)");
    $("#moon-altitude").text("Altitude: " + altitude + "°");

    $("#sun-rise").text("Rise: " + getAtTime(sunTimes.sunrise, "getPosition", "azimuth"));//formatTime(sunTimes.sunrise));
    $("#sun-noon").text("Noon: " + getAtTime(sunTimes.solarNoon, "getPosition", "altitude", "° alt."));
    $("#sun-set").text("Set: " + getAtTime(sunTimes.sunset, "getPosition", "azimuth"));
    $("#sun-length").text("Day Length: " + subtractDate(sunTimes.sunset, sunTimes.sunrise).toString());

    var min = Math.abs(sunTimes.sunrise);
    var max = Math.abs(sunTimes.sunset);
    var nowMS = Math.abs(new Date());
    var progress = (nowMS - min) / (max - min) * 100;

    $("#day-progress").text("Day Progress: " + Math.max(0, Math.min(100, round(progress, 1))) + "%");
    $("#morning-golden-hour").text(formatTime(sunTimes.goldenHourEnd));
    $("#night-golden-hour").text(formatTime(sunTimes.goldenHour));
    $("#time-used").text(day.toString());
}

function showContent(p) {
    coordinates = p.coords;
    $("#warning").hide();
    $("#try-again").hide();
    $("#content").show();

    update();
    setInterval(update, 5000);
}

function onNotesButtonClicked() {
    if($("#notes").is(":hidden")) {
        $("#notes").show();
        $("#notes-button").text("Hide Notes");
    }else{
        $("#notes").hide();
        $("#notes-button").text("Show Notes");
    }
    $("html, body").animate({ scrollTop: document.body.scrollHeight.toString() + "px" }, 10);
}

function onYesterdayClick() {
    dayOffset = -1;
    update();
}

function onTodayClick() {
    dayOffset = 0;
    update();
}

function onTomorrowClick() {
    dayOffset = 1;
    update();
}

function onConnectionError(error) {
    var msg = error.message + "<br>";

    switch(error.code) {
        case 1: msg += "Please allow location access and try again."; break;

        case 2:
        case 3:
            msg += "If you're on mobile, try going to settings and changing location mode from GPS to Wifi.";
            break;
    }

    $("#error-details").html(msg);

    $("#error").show();
    $("#try-again").show();
}

function connect() {
    if (window.localStorage.getItem("lat") === null || window.localStorage.getItem("lng") === null) {
        var options = {
            timeout : 10000, 
            enableHighAccuracy: false,
            maximumAge: 60000
        };
    
        navigator.geolocation.getCurrentPosition(function(position) {
            showContent(position);
            window.localStorage.setItem("lat", coordinates.latitude);
            window.localStorage.setItem("lng", coordinates.longitude);
        }, onConnectionError, options);
    } else {
        showContent({ 
            coords: {
                latitude: parseFloat(window.localStorage.getItem("lat")),
                longitude: parseFloat(window.localStorage.getItem("lng"))
            }
        });
        // change for github
    }
}

function onReady() {
    if (device.platform == "browser" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)) {
        //$("link").remove();
        //$("head").append('<meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width">');
        //$("head").append('<link rel="stylesheet" type="text/css" href="css/index-mobile.css"/>');
    }

    $("#notes-button").click(onNotesButtonClicked);
    $("#yesterday-button").click(onYesterdayClick);
    $("#today-button").click(onTodayClick);
    $("#tomorrow-button").click(onTomorrowClick);

    $("#try-again").click(function() {
        $("#error").hide();
        $("#try-again").hide();
        connect();
    });

    $("#reset-position").click(function() {
        window.localStorage.removeItem("lat");
        window.localStorage.removeItem("lng");
        window.location.reload(true);
    });

    connect();
    /*showContent({
        coords: {
            latitude: 51,
            longitude: -114
        }
    });*/
}

document.addEventListener("deviceready", onReady, false);

//$(document).ready(onReady);
