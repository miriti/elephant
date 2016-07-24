#!/usr/bin/env node
var moment = require('moment');
var fs = require('fs');

try {
    fs.accessSync('./elephant.json', fs.F_OK);
    
    var elephant = require('./elephant.json');

    function getTaskCompleteness(taskData) {
        if (taskData['done']) {
            if (taskData['done'] === true)
                return 100;

            return Number(taskData['done']);
        }

        if (taskData['progress']) {
            return Number(taskData['progress']);
        }

        /**
         * [0, 0, 50, 100] = 150/4
         */
        if (taskData['tasks']) {
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

    function printTaskTree(taskData, level) {
        var totalProgress = getTaskCompleteness(taskData);
        var subtasksCount;
        var doneCount;

        var start = null;

        if (taskData['start']) {
            start = moment(taskData['start']);
        }

        var due = null;
        var days_left = null;

        if (taskData['due']) {
            due = moment(taskData['due']);
            days_left = due.diff(moment(), 'days');
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

        var format = "%s [%s] %s [ " + (subtasksCount > 0 ? "%d/%d, " : "") + "%d% ]";

        if (due) {
            format += " DUE %s"
        }

        var data = [
            format,
            shift,
            totalProgress == 100 ? String.fromCharCode(0x2713) : ' ',
            taskData['title']
        ];

        if (subtasksCount > 0) {
            data.push(doneCount, subtasksCount);
        }

        data.push(Math.round(totalProgress));

        if (due) {
            data.push(due.format("llll"));
        }

        console.log.apply(console, data);

        if (totalProgress < 100) {

            if (totalProgress != 0) {
                process.stdout.write(shift + " " + progressBarString(totalProgress, 0.4));
                if (due != null) {
                    process.stdout.write(" " + due.fromNow());
                }
                process.stdout.write("\n");
            }

            if (taskData['description']) {

                var words = taskData['description'].split(' ');

                while (words.length) {
                    var new_line = "";

                    while ((new_line.length < 50) && (words.length)) {
                        new_line += words.shift() + ' ';
                    }

                    console.log("%s %s", shift, new_line);
                }

                process.stdout.write("\n");
            }
        }

        if (taskData['tasks']) {
            taskData['tasks'].forEach(function(subtaskData) {
                printTaskTree(subtaskData, level + 1);
            });
        }

        process.stdout.write("\x1b[0m");
    }

    printTaskTree(elephant, 0);
} catch (e) {
    console.error("elephant.js: file not found.");
}
