const jutsuParser = require("./jutsuParser")();
const downloader = require("./downloader")();
const downloadManager = require("./downloadManager")();
const UI = require("./consoleUI")();
const cli = require("cli");

const Main = () => {
	console.log("START");
	//DownloadManagerTest();
	UITest();
};

const UITest = () => {
	UI.StartDrawLoop();
};

const DownloadManagerTest = () => {
	jutsuParser.Parse("https://jut.su/grand-blue/").then((episodes) => {
		const blackList = [
			"1-1",
			"1-3",
			"1-4",
			"1-5",
			"1-6",
			"1-7",
			"1-8",
			"1-9",
			"1-10",
			"1-11",
			//"1-12",
		];

		const GetSettings = async (blackList, quality) => {
			const dowSettings = [];
			let s = 1;
			let e = 1;

			while (true) {
				e = 1;
				let content = episodes(s, e);
				if (!content) break;

				while (content) {
					if (!blackList.includes(`${s}-${e}`))
						dowSettings.push([
							content,
							(await content.getUrl())[quality],
						]);

					e++;
					content = episodes(s, e);
				}
				s++;
			}
			return dowSettings;
		};

		GetSettings(blackList, 1080).then((settings) => {
			console.log(settings);
			downloadManager.AddDownload(settings);
			downloadManager.StartDownload();
		});
	});
};

const DownloadTest = () => {
	jutsuParser.Parse("https://jut.su/grand-blue/").then((res) => {
		cli.ok("Parse completed.");
		res(1, 1)
			.getUrl()
			.then((res) => {
				cli.ok("Url to file received.");
				downloader
					.Download(res[1080], __dirname + "/1-1.mp4")
					.on("progress", (pr, speed) => {
						console.log(pr + "% | " + speed);
					});
			});
	});
};

Main();
