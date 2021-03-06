const downloader = require("./downloader")();

module.exports = (settings) => {
	const fs = require("fs");

	const OPTIONS_PATH = "./options.json";

	let options = { queue: [] };
	const LoadOptions = () => {
		const SaveOptions = () => {
			fs.writeFileSync(OPTIONS_PATH, JSON.stringify(options));
		};

		if (fs.existsSync(OPTIONS_PATH))
			options = JSON.parse(fs.readFileSync(OPTIONS_PATH));
		const _options = options;
		options = new Proxy(
			{},
			{
				set(target, prop, val) {
					val = new Proxy(val, {
						set(target, prop, val) {
							target[prop] = val;
							SaveOptions();
							return true;
						},
					});
					target[prop] = val;
					SaveOptions();
					return true;
				},
			}
		);
		Object.entries(_options).forEach((val) => {
			options[val[0]] = val[1];
		});
	};
	const UpdateSettings = () => {};

	const IsDownloaded = () => {
		let isDownloaded = false;
		if (options.queue && options.queue.length) isDownloaded = true;

		isDownloaded.queue = options.queue;

		return isDownloaded;
	};

	const StartDownload = () => {
		let qi = 0;
		const StartQueue = () => {
			const queue = options.queue[qi];

			let ei = 0;

			const StartEpisode = () => {
				const episode = queue.episode[ei];
				const dowInfo = downloader.Download(
					episode[1],
					`./${queue.name}/${episode[0].season}-${episode[0].episode}`
				);

				ei++;
			};
		};
	};

	/**
	 *
	 * @param {Array} episodes
	 */
	const AddDownload = (episodes) => {
		const downloadInfo = {
			episodes: episodes,
			name: episodes[0].name,
		};

		options.queue.push(downloadInfo);
	};

	const api = UpdateSettings;
	api.AddDownload = AddDownload;
	api.StartDownload = StartDownload;
	api.IsDownloaded = IsDownloaded;

	LoadOptions();

	return api;
};
