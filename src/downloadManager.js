const cli = require("cli");
const jutsuParser = require("./jutsuParser")();

const downloader = require("./downloader")();

const log = require("./loger")();

module.exports = (settings) => {
	const fs = require("fs");
	const EventEmitter = require("events").EventEmitter;

	const OPTIONS_PATH = "./options.json";

	const events = new EventEmitter();

	let isActive = false;
	let options = { queue: [] };
	const LoadOptions = () => {
		const SaveOptions = () => {
			fs.writeFileSync(OPTIONS_PATH, JSON.stringify(options));
		};

		if (fs.existsSync(OPTIONS_PATH)) {
			options = JSON.parse(fs.readFileSync(OPTIONS_PATH));
			options.queue.forEach((queue) => {
				queue.episodes.forEach((episode) => {
					episode.getUrl = () =>
						jutsuParser.GetUrl(
							episode.name,
							episode.season,
							episode.episode
						);
				});
			});
		}
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

	const GetDownloadInfo = () => {
		const info = {
			isActive: isActive,
			queue: options.queue,
			activeDownload: options.queue[0] || undefined,
		};

		return info;
	};

	const StartDownload = () => {
		log(`START download: ${isActive}`);
		if (isActive) return;
		isActive = true;

		const RemoveFromQueue = (episode) => {
			options.queue.forEach((q) => {
				q.episodes = q.episodes.filter(
					(e) =>
						!(
							e.name === episode.name &&
							e.season === episode.season &&
							e.episode === episode.episode
						)
				);
			});
		};

		const AddEndHook = (dowInfo) => {
			const dowInfoId = AddEndHook._dii ? AddEndHook._dii + 1 : 0;
			dowInfo.on("end", () => {
				if (dowInfoId === AddEndHook._dii) isActive = false;
				RemoveFromQueue(dowInfo.episode);
				events.emit("queue-update");
			});

			AddEndHook._dii = dowInfoId;
		};

		const AddToQueue = (dowInfo) => {
			const queue = AddToQueue._queue || [];

			if (queue.length === 0) {
				cli.debug(
					`Start download ${dowInfo.episode.season}-${dowInfo.episode.episode}`
				);
				dowInfo.StartDownload();
			} else {
				queue[queue.length - 1].on("end", () => {
					cli.debug(
						`Start download ${dowInfo.season}-${dowInfo.episode}`
					);
					dowInfo.StartDownload();
				});
			}
			queue.push(dowInfo);

			AddToQueue._queue = queue;
		};

		const AddProgressHandler = (dowInfo) => {
			dowInfo.on("progress", (progress, speed) => {
				events.emit("progress", dowInfo.episode, progress, speed);
			});
		};

		const Start = async () => {
			let qi = 0;
			let queue = options.queue[qi];
			while (queue) {
				let ei = 0;

				let episode = queue.episodes[ei];
				while (episode) {
					if (!fs.existsSync(`./${episode.name}/`))
						fs.mkdirSync(`./${episode.name}`);
					const dowInfo = downloader.Download(
						(await episode.getUrl())[episode.quality],
						`./${episode.name}/${episode.season}-${episode.episode}.mp4`
					);
					dowInfo.episode = episode;
					dowInfo.url = (await episode.getUrl())[episode.quality];

					AddEndHook(dowInfo);
					AddToQueue(dowInfo);
					AddProgressHandler(dowInfo);
					ei++;
					episode = queue.episodes[ei];
				}
				qi++;
				queue = options.queue[qi];
			}
		};
		Start();
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

		if (!isActive) StartDownload();
	};

	const api = UpdateSettings;
	api.AddDownload = AddDownload;
	api.StartDownload = StartDownload;
	api.GetDownloadInfo = GetDownloadInfo;
	api.on = (name, callback) => {
		return events.addListener(name, callback);
	};

	LoadOptions();
	StartDownload();

	return api;
};
