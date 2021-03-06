module.exports = () => {
	const cli = require("cli");
	const fs = require("fs");
	const axios = require("axios").default;
	const EventEmitter = require("events").EventEmitter;
	const filesize = require("filesize");

	const api = () => {};

	const Download = (url, path) => {
		const events = new EventEmitter();

		let compl = 0;
		if (fs.existsSync(path)) {
			//const chunksCompl = Math.floor(fs.statSync(path).size / 16384);
			//compl = chunksCompl * 16384;
			// cli.debug(
			// 	`File exists. Chunks compl: ${chunksCompl}. Compl: ${compl}`
			// );
			compl = fs.statSync(path).size;
		}

		const downloadInfo = {
			on: (name, callback) => {
				events.addListener(name, callback);
				cli.debug(`Event added: ${name}`);
			},
		};

		const file = fs.createWriteStream(path, {
			flags: "a",
			start: compl == 0 ? 0 : compl + 1,
		});
		cli.debug("File: " + path);
		axios({
			method: "GET",
			url: url,
			responseType: "stream",
			headers: { Range: `bytes=${compl}-` },
		}).then((res) => {
			cli.debug(
				`Download setting: Range=${compl}-${
					parseInt(res.headers["content-length"], 10) + compl
				}`
			);

			const length = parseInt(res.headers["content-length"], 10) + compl;

			const GetSpeed = () => {
				let speed;

				if (!GetSpeed._lastCheck) {
					GetSpeed._lastCheck = Date.now();
					GetSpeed._lastCompl = compl;
				}

				if (Date.now() - GetSpeed._lastCheck >= 2500) {
					speed =
						filesize(
							Math.round(
								(compl - GetSpeed._lastCompl) /
									((Date.now() - GetSpeed._lastCheck) / 1000)
							)
						) + "/SEC";

					GetSpeed._lastSpeed = speed;
					GetSpeed._lastCheck = Date.now();
					GetSpeed._lastCompl = compl;
				}

				return speed || GetSpeed._lastSpeed || "";
			};

			const Progress = (pr) => {
				if (this._progress != pr) {
					events.emit("progress", pr, GetSpeed());
					this._progress = pr;
					this._compl = compl;
				}
			};

			res.data.on("data", (chunk) => {
				file.write(chunk);
				compl += chunk.length;
				Progress(((100.0 * compl) / length).toFixed(2));
			});

			res.data.on("end", () => {
				file.close();
				events.emit("end");
			});

			res.data.on("error", (err) => {
				console.error(err);
				events.emit("end", err);
			});

			cli.ok("Download started!");
		});

		return downloadInfo;
	};

	api.Download = Download;

	return api;
};
