#!/usr/bin/env node

var fs = require('fs');
var prompt = require('prompt');
var project = require('../lib/project.js');
var moment = require('moment');

var help = function() {
    console.log("Help");
};

var commands = {
    help: help
};

var args = {
    command: 'tree'
};

try {
    fs.accessSync('./elephant.json', fs.F_OK);

    try {
        var elephant = JSON.parse(fs.readFileSync('./elephant.json'));

        commands['tree'] = function() {
            var deep = 9999;

            if (process.argv[3]) {
                var task = project.getTaskById(elephant, Number(process.argv[3]));
                if (task != null) {
                    project.taskTree(task, 0, deep);
                } else {
                    console.error("Task not found");
                }
            } else {
                project.taskTree(elephant, 0, deep);
            }
        }

        commands['add'] = function() {
            prompt.start();
            prompt.get(['title', 'description', 'due'], function(err, result) {
                var newTask = {
                    id: elephant['next_id']++,
                    title: result.title,
                    created: moment().format()
                }

                if (result.description) {
                    newTask['description'] = result.description;
                }

                if (result.due) {
                    var due_date = moment(result.due)
                    newTask['due'] = due_date.format();
                }

                var targetElephant = elephant;

                if (process.argv[3]) {
                    var task = project.getTaskById(elephant, Number(process.argv[3]))

                    if (task != null) {
                        targetElephant = task;
                    }
                }

                targetElephant['tasks'] = targetElephant['tasks'] || [];
                targetElephant['tasks'].push(newTask);

                fs.writeFileSync('./elephant.json', JSON.stringify(elephant, null, '  '));
            });
        }

        commands['progress'] = function() {
            if ((process.argv[3]) && (process.argv[4])) {
                var task = project.getTaskById(elephant, Number(process.argv[3]));

                if (task != null) {
                    task['progress'] = Number(process.argv[4]);
                    fs.writeFileSync('./elephant.json', JSON.stringify(elephant, null, '  '));
                }else{
                    console.error("Task not found");
                }
            }
        }

        var command = 'tree';

        if (process.argv[2]) {
            if (commands.hasOwnProperty(process.argv[2])) {
                command = process.argv[2];
            } else {
                console.error("\x1b[31mError:\x1b[0m Unknown command <%s>", process.argv[2]);
                help();
                process.exit();
            }
        }

        commands[command]();
    } catch (e) {
        console.error("Error decoding elephant.js", e);
    }
} catch (e) {
    console.error("elephant.js: file not found.\n");
    help();
}
