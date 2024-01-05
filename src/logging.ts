// Set console log level thanks to haschtl @ https://stackoverflow.com/questions/12539599/node-js-command-line-console-log-level
import * as fs from 'fs';

/**
 * Creates a new log file with current date + time as filename
 */
export const createLogFile = () => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
    const filename = `log_${formattedDate}.txt`;

    fs.writeFileSync(filename, '');

    // @ts-ignore
    global.logFile = filename;
}

/**
 * Appends a message to the current log file
 */
const appendToLogFile = (message: string) => {
    // @ts-ignore
    const filename = global.logFile;

    fs.appendFileSync(filename, message + '\n');
}

type LogLevel = "debug" | "log" | "info" | "warn" | "error" | "none";
let logLevels = ["debug", "log", "info", "warn", "error", "none"];
let shouldLog = (level: LogLevel) => {
    // @ts-ignore
    return logLevels.indexOf(level) >= logLevels.indexOf(global.logLevel);
};

// @ts-ignore
global.logLevel = "info";
let _console = console
global.console = {
    ...global.console,
    log: (message?: any, ...optionalParams: any[]) => {
        shouldLog("log") && _console.info(message, ...optionalParams)
        appendToLogFile(message);
    },
    info: (message?: any, ...optionalParams: any[]) => {
        shouldLog("info") && _console.info(message, ...optionalParams)
        appendToLogFile(message);
    },
    warn: (message?: any, ...optionalParams: any[]) => {
        shouldLog("warn") && _console.warn(message, ...optionalParams)
        appendToLogFile(message);
    },
    error: (message?: any, ...optionalParams: any[]) => {
        shouldLog("error") && _console.error(message, ...optionalParams)
        appendToLogFile(message);
    },
    debug: (message?: any, ...optionalParams: any[]) => {
        shouldLog("debug") && _console.debug(message, ...optionalParams)
        appendToLogFile(message);
    },
};
