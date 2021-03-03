module.exports = (settings) => {
	const fs = require("fs");

	const OPTIONS_PATH = "./options.json";
	const AUTO_SAVE_OPTIONS_TIMEOUT = 2500;

	let options = { queue: undefined };
	const LoadOptions = () => {
		if (fs.existsSync(OPTIONS_PATH))
			options = JSON.parse(fs.readFileSync(OPTIONS_PATH));
		else options = {};
	};
	const AutoSaveOptions = () => {
		fs.writeFile(OPTIONS_PATH, JSON.stringify(options));
		setTimeout(AutoSaveOptions, AUTO_SAVE_OPTIONS_TIMEOUT);
	};
	const UpdateSettings = () => {};

	const IsDownloaded = () => {
		let isDownloaded = false;
		if (options.queue) isDownloaded = true;

		isDownloaded.queue = options.queue;

		return isDownloaded;
	};

	const AddDownload = () => {};

	const api = UpdateSettings;
	api.AddDownload = AddDownload;

	LoadOptions();
	AutoSaveOptions();

	return api;
};
