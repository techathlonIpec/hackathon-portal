
$(document).ready(function () {
    "use strict";

    // UTILITY
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    // END UTILITY

    // COMMANDS
    function clear() {
        terminal.text("");
    }

    function help() {
        terminal.append("Login using the login command. Type your credentials in following format\n'login teamname password'\n");
    }

    function login(args) {

        var str = args.join(" ");
        if (args[0]) {
            if (args[1]) {
                $('#teamName').val(args[0])
                $('#password').val(args[1])

                document.getElementById("loginForm").submit()
            }
            else {
                terminal.append("login command requires password. Try help.\n");
            }
        }
        else {
            terminal.append("login command requires teamname & password. Try help.\n");
        }

    }

    function motivateme() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.quotable.io/random', false);
        xhr.send(null);

        if (xhr.status === 200) {
            var fortune = JSON.parse(xhr.response).content;
            terminal.append(fortune + "\n");
        }
    }
    function followTrinity() {
        window.open('https://www.instagram.com/ipectrinity/', '_blank')
    }
    // END COMMANDS

    var title = $(".title");
    var terminal = $(".terminal");
    var prompt = "➜";
    var path = "$";

    var commandHistory = [];
    var historyIndex = 0;

    var command = "";
    var commands = [{
        "name": "login",
        "function": login
    }, {
        "name": "help",
        "function": help
    }, {
        "name": "motivateme",
        "function": motivateme
    }, {
        "name": "follow-trinity",
        "function": followTrinity
    }, {
        "name": "clear",
        "function": clear
    }
    ];

    function processCommand() {
        var isValid = false;

        // Create args list by splitting the command
        // by space characters and then shift off the
        // actual command.

        var args = command.split(" ");
        var cmd = args[0];
        args.shift();

        // Iterate through the available commands to find a match.
        // Then call that command and pass in any arguments.
        for (var i = 0; i < commands.length; i++) {
            if (cmd === commands[i].name) {
                commands[i].function(args);
                isValid = true;
                break;
            }
        }

        // No match was found...
        if (!isValid) {
            terminal.append("zsh: command not found: " + command + "\n");
        }

        // Add to command history and clean up.
        commandHistory.push(command);
        historyIndex = commandHistory.length;
        command = "";
    }

    function displayPrompt() {
        terminal.append("<span class=\"prompt\">" + prompt + "</span> ");
        terminal.append("<span class=\"path\">" + path + "</span> ");
    }

    // Delete n number of characters from the end of our output
    function erase(n) {
        command = command.slice(0, -n);
        terminal.html(terminal.html().slice(0, -n));
    }

    function clearCommand() {
        if (command.length > 0) {
            erase(command.length);
        }
    }

    function appendCommand(str) {
        terminal.append(str);
        command += str;
    }

    /*
        //	Keypress doesn't catch special keys,
        //	so we catch the backspace here and
        //	prevent it from navigating to the previous
        //	page. We also handle arrow keys for command history.
        */

    $(document).keydown(function (e) {
        e = e || window.event;
        var keyCode = typeof e.which === "number" ? e.which : e.keyCode;

        // BACKSPACE
        if (keyCode === 8 && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
            e.preventDefault();
            if (command !== "") {
                erase(1);
            }
        }

        // UP or DOWN
        if (keyCode === 38 || keyCode === 40) {
            // Move up or down the history
            if (keyCode === 38) {
                // UP
                historyIndex--;
                if (historyIndex < 0) {
                    historyIndex++;
                }
            } else if (keyCode === 40) {
                // DOWN
                historyIndex++;
                if (historyIndex > commandHistory.length - 1) {
                    historyIndex--;
                }
            }

            // Get command
            var cmd = commandHistory[historyIndex];
            if (cmd !== undefined) {
                clearCommand();
                appendCommand(cmd);
            }
        }
    });

    $(document).keypress(function (e) {
        // Make sure we get the right event
        e = e || window.event;
        var keyCode = typeof e.which === "number" ? e.which : e.keyCode;

        // Which key was pressed?
        switch (keyCode) {
            // ENTER
            case 13:
                {
                    terminal.append("\n");

                    processCommand();
                    displayPrompt();
                    break;
                }
            default:
                {
                    appendCommand(String.fromCharCode(keyCode));
                }
        }
    });

    // Set the window title
    title.text("Trinity Cyber Forum terminal@dare2develop");

    // Display last-login and promt
    if (document.getElementById("errorMessage")) {
        terminal.append('Invalid Credentials. Try Again or type help.\n')
        displayPrompt();
    }
    else {
        terminal.append("Welcome to Dare2Develop by Trinty Cyber Forum.\nThere are 4 commands available here.\n1. login\n2. help\n3. motivateme\n4. follow-trinity\n5. clear\n"); displayPrompt();
    }
});