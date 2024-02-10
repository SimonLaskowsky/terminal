document.addEventListener('DOMContentLoaded', function () {

    window.userMessage = document.getElementById("userMessage");
    window.messageHint = document.getElementById("messageHint");
    output = document.getElementById("output");
    terminalWindow = document.getElementById("terminalWindow");
    document.getElementById("userMessageInput").focus();
    const closeBtn = document.querySelector('.close');
    const minBtn = document.querySelector('.min');
    const maxBtn = document.querySelector('.max');
    const terminal = document.querySelector('.terminal');
    let isHintShowed = false;
    let hintMessage;
    const commandHistory = [];
    let historyIndex = -1;
    let commandAndHintAreEqual = false;

    terminalWindow.scrollTop = terminalWindow.scrollHeight;

    // Get random quote from api
    const fetchQuote = async () => {
        const response = await fetch('https://dummyjson.com/quotes/random');
        if (!response.ok) {
            throw new Error('Failed to fetch quote');
        }
        const data = await response.json();
        return data.quote;
    };

    // Custom commands
    const CUSTOM_COMMANDS = {
        hello: {
            msg: 'Hello :)',
        },
        // Add more custom commands as needed
    };

    // Build in commands
    const COMMANDS = {
        ...CUSTOM_COMMANDS,
        about: 'Wiem że projekt delikatnie różni się od proponowanego designu, postanowiłem trochę zaszaleć ;) dodatkowe funkcjonalności: <br> -wrażenie pisania w terminalu <br> -możliwość autouzupełnienia podpowiadanej komendy przy użyciu enter / tab <br> -czyż ten czerowny przycisk nie jest kuszący?',
        clear: function() {
            output.innerHTML = "";
            return;
        },
        help: function() {
            const commandsList = Object.keys(COMMANDS).join(', ');
            return `Available commands ${commandsList}`;
        },
        quote: async function() {
            try {
                const quote = await fetchQuote();
                return quote;
            } catch (error) {
                return error.message;
            }
        },
        double: function(number) {
            if (!number || isNaN(number)) {
                return 'Usage: double [number]';
            }
            return parseFloat(number) * 2;
        }
    };

    // Menu buttons handling - little easter egg
    closeBtn.addEventListener('click', function() {
        window.close();
    });
    minBtn.addEventListener('click', function() {
        terminal.style.maxWidth = '726px';
        terminal.style.maxHeight = '374px';
    });
    maxBtn.addEventListener('click', function() {
        terminal.style.maxWidth = '100%';
        terminal.style.maxHeight = '100%';
    });

    // Keyboard handling 
    document.addEventListener('keydown', function(e) {
        // Fill our typing by last commands in commandHisotry by ArrowDown and ArrowUp
        if (e.key === "ArrowDown" && commandHistory.length > 0) {
            historyIndex = Math.max(0, historyIndex - 1);
            userMessage.innerHTML = commandHistory[historyIndex];
        
        } else if (e.key === "ArrowUp" && commandHistory.length > 0) {
            historyIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
            userMessage.innerHTML = commandHistory[historyIndex] || "";
        
        // Fill our typing with hint by enter or tab but only when hint is showed and we didnt wrote whole command 
        } else if ((e.key === "Enter" || e.key === "Tab") && isHintShowed && !commandAndHintAreEqual){
            e.preventDefault()
            userMessage.innerHTML = hintMessage;
            hideHints();

        // Run command
        } else if (e.key === "Enter") {
            runCommand(userMessage.innerHTML);
            userMessage.innerHTML = "";
            hideHints();
            return;

        // Delete what we were writing
        } else if (e.key === "Backspace" || e.key === "Delete") {
            userMessage.innerHTML = userMessage.innerHTML.slice(0, userMessage.innerHTML.length - 1);
            showHints(userMessage.innerHTML);

        // We take: caps letters, normal letters, numbers and space
        } else if(e.keyCode >= 65 && e.keyCode <= 90 || e.keyCode >= 97 && e.keyCode <= 122 || e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode == 32 ) {
            userMessage.innerHTML += e.key;
            showHints(userMessage.innerHTML);
        }
    });

    //Show hints matching our typing
    const showHints = (currentCommand) => {
        const matchingCommands = Object.keys(COMMANDS).filter(command =>
            command.startsWith(currentCommand.toLowerCase())
        );
        if (matchingCommands.length > 0 && !userMessage.innerHTML == "") {
            const hint = matchingCommands.map(command => combineCommonCommand(command, currentCommand)).join(" ");
            messageHint.innerHTML = `<div class="message">${hint}</div>`;
            isHintShowed = true;
        
            const firstMatchingCommand = matchingCommands[0];
            commandAndHintAreEqual = currentCommand.toLowerCase() === firstMatchingCommand.toLowerCase();
        } else {
            hideHints();
        }
        terminalWindow.scrollTop = terminalWindow.scrollHeight;
    };

    // Hide hints
    const hideHints = () => {
        messageHint.innerHTML = "";
        isHintShowed = false;
    };

    // Combine our typing and rest of the command
    const combineCommonCommand = (fullCommand, currentCommand) => {
        const commonPrefix = getCommonPrefix(fullCommand.toLowerCase(), currentCommand.toLowerCase());
        const restOfCommand = fullCommand.substring(commonPrefix.length);
        const combinedCommand = `<span>${commonPrefix}</span><span class="hint">${restOfCommand}</span>`;
        hintMessage = commonPrefix + restOfCommand;
        return combinedCommand;
    };

    const getCommonPrefix = (str1, str2) => {
        let i = 0;
        while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
            i++;
        }
        return str1.substring(0, i);
    };

    // Run commands
    const runCommand = async (command) => {
        let outputMessage;
        command = command.trim().toLowerCase(); // Trim any leading/trailing spaces
    
        if (command.length === 0) {
            return;
        }
    
        // Command we did type
        outputMessage = `<div class="message"><span>~</span> ${command}</div>`;
    
        // Check for arguments
        const commandParts = command.split(' ');
        const commandName = commandParts[0];
        const args = commandParts.slice(1);
    
        // Check if it's a custom command
        if (CUSTOM_COMMANDS.hasOwnProperty(commandName)) {
        outputMessage += `<div class="message">${CUSTOM_COMMANDS[commandName].msg}</div>`;

        // We don't have this command
        } else if (!COMMANDS.hasOwnProperty(commandName)) {
            outputMessage += `<div class="message">no such command: <span class="output">"${commandName}"</span></div>`;
        
        } else {
            // It's a function
            if (typeof COMMANDS[commandName] === 'function') {
                const result = await COMMANDS[commandName](...args);

                // It isnt void funtion
                if(result !== undefined) {
                    outputMessage += `<div class="message">${result}</div>`;
                }
            } else {
                outputMessage += `<div class="message">${COMMANDS[commandName]}</div>`;
            }
        }
    
        output.innerHTML = `${output.innerHTML}<div class="message">${outputMessage}</div>`;
    
        terminalWindow.scrollTop = terminalWindow.scrollHeight;
    
        if (command.length > 0) {
            commandHistory.unshift(command);
            historyIndex = -1;
        }
    };
});
