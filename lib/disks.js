var exec = require('sync-exec'),
    path = require('path'),
    os = require('os');

var numeral = require('numeral');

/**
 * Retrieve disks list.
 *
 */
exports.drives = function () {
    var result = undefined;

    switch (os.platform().toLowerCase()) {
        case'darwin':
            result = getDrives('df -kl | awk \'{print $1}\'');
            break;
        case'win32':
            var d = getDrives('wmic logicaldisk get caption');
            if(d) {
                for(var i=0; d.length > i; i++) {
                    d[i] = d[i].trim();
                }
                d.pop();
            }
            result = d;
            break;
        case'linux':
        default:
            result = getDrives('df -P | awk \'{print $1}\'');
    }

    return result;
};

/**
 * Execute a command to retrieve disks list.
 *
 * @param command
 */
function getDrives(command) {
    var result = exec(command, 2000);
    var drives = result.stdout.split('\n');

    drives.splice(0, 1);
    drives.splice(-1, 1);

    // Removes ram drives
    return drives.filter(function(item){ return item != 'none';});
}

/**
 * Retrieve space information about one drive.
 *
 * @param drive
 */
exports.driveDetail = function (drive) {
    return detail(drive);
};

/**
 * Retrieve space information about each drives.
 *
 * @param drives
 */
exports.drivesDetail = function (drives) {
    return drives.map(detail);
};

/**
 * Retrieve space information about one drive.
 *
 * @param drive
 */
function detail(drive) {
    var used = getUsed(drive);
    var available = getAvailable(drive);
    var mountpoint = getMountpoint(drive);
    var volumename = getVolumename(drive);
    var freePer = Number(available / (used + available) * 100);
    var usedPer = Number(used / (used + available) * 100);
    return {
        used: used,
        available: available,
        mountpoint: mountpoint,
        volumename: volumename,
        freePer: freePer,
        usedPer: usedPer,
        drive: drive
    };
}

function getUsed(drive) {
    var result = undefined;
    switch (os.platform().toLowerCase()) {
        case'darwin':
            result = getDetail('df -kl | grep ' + drive + ' | awk \'{print $3}\'');
            break;
        case'win32':
            var d = getDetailNaN('wmic logicaldisk get caption,freespace,size | FindStr "' + drive + '"');
            if(d) {
                d = d.substr(2);
                d = d.trim();
                d = d.split(" ");
                d = (parseInt(d[d.length-1]) - parseInt(d[0]));
            }
            result = d;
            break;
        case'linux':
        default:
            result = getDetail('df -P | grep ' + drive + ' | awk \'{print $3}\'');
    }
    return result;
}

function getAvailable(drive){
    var result = undefined;
    switch (os.platform().toLowerCase()) {
        case'darwin':
            result = getDetail('df -kl | grep ' + drive + ' | awk \'{print $4}\'');
            break;
        case'win32':
            var d = getDetailNaN('wmic logicaldisk get caption,freespace | FindStr "' + drive + '"');
            if(d) {
                d = d.substr(2);
                d = parseInt (d.trim(), 10);
            }
            result = d;
            break;
        case'linux':
        default:
            result = getDetail('df -P | grep ' + drive + ' | awk \'{print $4}\'');
    }
    return result;
}

function getMountpoint(drive){
    var result = undefined;
    switch (os.platform().toLowerCase()) {
        case'darwin':
            var d = getDetailNaN('df -kl | grep ' + drive + ' | grep -oh \' /.*\'');
            if (d) d = d.trim();
            result = d;
            break;
        case'win32':
            result = drive;
            break;
        case'linux':
        default:
            var d= getDetailNaN('df -P | grep ' + drive + ' | grep -oh \' /.*\'');
            if (d) d = d.trim();
            result = d;
    }
    return result;
}

function getVolumename(drive){
    var result = undefined;
    switch (os.platform().toLowerCase()) {
        case'darwin':
            var d=getDetailNaN('df -kl | grep ' + drive + '| grep -oh \' /.*\'');
            d = path.basename(d.trim());
            result = d;
            break;
        case'win32':
            var d = getDetailNaN('wmic logicaldisk get caption,volumename | FindStr "' + drive + '"');
            if(d) {
                d = d.substr(2);
                d = d.trim();
            }
            result = d;
            break;
        case'linux':
        default:
            var d = getDetailNaN('df -P | grep ' + drive + '| grep -oh \' /.*\'');
            if (d) {
                d = path.basename(d.trim());
            }
            result = d;
    }
    return result;
}

/**
 * Execute a command.
 *
 * @param command
 */
function getDetail(command) {
    var result = exec(command, 2000);
    return parseInt(result.stdout) * 1024;
}

/**
 * Execute a command.
 *
 * @param command
 */
function getDetailNaN(command) {
    var result = exec(command, 2000);
    return result.stdout;
}
