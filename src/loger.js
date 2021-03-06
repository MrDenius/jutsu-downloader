module.exports = () => {
	const fs = require("fs");

	const LOG_FILE_PATH = "./logs.log";

	let start = 0;
	if (fs.existsSync(LOG_FILE_PATH)) {
		start = fs.statSync(LOG_FILE_PATH).size;
	}

	const logFile = fs.createWriteStream(LOG_FILE_PATH, {
		flags: "a",
		start: start == 0 ? 0 : start + 1,
	});

	const Log = (text) => {
		if (typeof text != "string") text = JSON.stringify(text);
		text = `${Date()} [${process.pid}] => ${text}\n`;
		LogToConsole(text);
		LogToFile(text);
	};

	const LogToConsole = (text) => {
		console.log(text);
	};

	const LogToFile = (text) => {
		logFile.write(text);
	};

	return Log;
};
