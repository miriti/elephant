var moment = require('moment');
var sprintf = require('sprintf-js').sprintf;

function getTaskCompleteness(taskData) {
    if (taskData['done']) {
        if (taskData['done'] === true)
            return 100;

        return Number(taskData['done']);
    }

    if (taskData['progress']) {
        return Number(taskData['progress']);
    }

    if ((taskData['tasks']) && (taskData['tasks'].length)) {
        var subtaskProgress = taskData['tasks'].map(function(subtask) {
            return getTaskCompleteness(subtask);
        });

        var percentSum = 0;

        for (var i = 0; i < subtaskProgress.length; i++) {
            percentSum += subtaskProgress[i];
        }

        return (percentSum / subtaskProgress.length);
    }

    return 0;
}

function progressBarString(percents, scale) {
    scale = scale || 1;

    percents = Math.ceil(Math.max(0, Math.min(percents, 100)) * scale);
    var bars = Math.ceil(100 * scale);

    var str = "";

    for (var i = 0; i <= bars; i++) {
        str += (i < percents) ? '\x1b[44m \x1b[0m' : '\x1b[47m \x1b[0m';
    }

    return str;
}

var taskTree = exports['taskTree'] = function(taskData, level) {
    var totalProgress = getTaskCompleteness(taskData);
    var subtasksCount;
    var doneCount;

    var start = null;

    if (taskData['start']) {
        start = moment(taskData['start']);
    }

    var due = null;

    if (taskData['due']) {
        due = moment(taskData['due']);
    }

    if (taskData['tasks']) {
        subtasksCount = taskData['tasks'].length;
        doneCount = taskData['tasks'].filter(function(subtaskData) {
            return getTaskCompleteness(subtaskData) == 100;
        }).length;
    } else {
        subtasksCount = 0;
        doneCount = 0;
    }

    level = level || 0;

    var shift = (function() {
        var s = "";
        for (var i = 0; i < level; i++) {
            s += "  ";
        }
        return s;
    })();

    if (totalProgress == 100) {
        process.stdout.write("\x1b[2m");
    }

    var taskTitle = shift;

    taskTitle += totalProgress == 100 ? sprintf("[%s]", String.fromCharCode(10003)) : "[ ]";

    if (taskData['id']) {
        taskTitle += " #" + taskData['id'];
    }

    if (taskData['title']) {
        taskTitle += " \x1b[1m" + taskData['title'] + "\x1b[0m";
    }

    taskTitle += sprintf(" %d%%", totalProgress);

    if (subtasksCount > 0) {
        taskTitle += sprintf(" (%s/%s done)", doneCount, subtasksCount);
    }

    if (due) {
        taskTitle += " \x1b[33mdue " + due.format('llll') + " (\x1b[1m" + due.fromNow() + "\x1b[0m)\x1b[0m";
    }

    console.log(taskTitle);

    if (totalProgress < 100) {
        if (totalProgress != 0) {
            process.stdout.write(shift + progressBarString(totalProgress, 0.4));
            process.stdout.write("\n");
        }

        if (taskData['description']) {

            var words = taskData['description'].split(' ');

            while (words.length) {
                var new_line = "";

                while ((new_line.length < 50) && (words.length)) {
                    new_line += words.shift() + ' ';
                }

                console.log("%s%s", shift, new_line);
            }
        }
    }

    if (taskData['tasks']) {
        taskData['tasks'].forEach(function(subtaskData) {
            if (getTaskCompleteness(subtaskData) < 100) {
                taskTree(subtaskData, level + 1);
            }
        });
    }

    process.stdout.write("\x1b[0m");
}

var getTaskById = exports['getTaskById'] = function(elephant, id) {
    if (elephant['tasks']) {
        for (var i in elephant['tasks']) {
            var subtask = elephant['tasks'][i];
            if ((subtask['id']) && (subtask['id'] == id)) {
                return subtask;
            } else {
                var subresult = getTaskById(subtask, id);

                if (subresult != null) {
                    return subresult;
                }
            }
        }
    } else {
        return null;
    }
}
