const cli = require("cli");
const { resolve } = require("path");

module.exports = () => {
	const JSDOM = require("jsdom").JSDOM;
	const axios = require("axios").default;

	const api = () => {};

	const parse = (url) => {
		return new Promise((resolve, reject) => {
			axios.get(url).then((res) => {
				const document = new JSDOM(res.data).window.document;

				const getEpisode = (season, episode) => {
					cli.debug(`Episode loaded: [${season}, ${episode}]`);
					let ret;
					if (getEpisode[season]) ret = getEpisode[season][episode];
					return ret;
				};

				document
					.querySelectorAll("a.short-btn.video.the_hildi")
					.forEach((el) => {
						let episode = el.href
							.replace(/^\/|(.html)|(season-)|(episode-)/g, "")
							.split("/");

						if (episode.length === 2)
							episode = [episode[0], 1, episode[1]];

						console.log(episode);
						if (!getEpisode[episode[1]])
							getEpisode[episode[1]] = {};

						episode[1] = Number(episode[1]);
						episode[2] = Number(episode[2]);
						getEpisode[episode[1]][episode[2]] = {
							name: episode[0],
							season: episode[1],
							episode: episode[2],
							getUrl: () => {
								return GetUrl(
									episode[0],
									episode[1],
									episode[2]
								);
							},
						};
					});
				resolve(getEpisode);
				return;
			});
		});
	};

	const GetUrl = (name, season, episode) => {
		return new Promise((resolve, reject) => {
			if (GetUrl.url && Object.entries(GetUrl.url).length != 0) {
				resolve(GetUrl.url);
				return;
			}

			let href = `https://jut.su/${name}`;
			if (season) href += `/season-${season}`;
			if (episode) href += `/episode-${episode}.html`;

			GetUrl.url = {};
			axios.get(href).then((res) => {
				const docEpisode = new JSDOM(res.data).window.document;
				const datasets = docEpisode.querySelector("span#wap_player_1")
					.dataset;
				const qualities = [160, 240, 360, 480, 720, 1080, 1440, 2480];

				qualities.forEach((quality) => {
					if (datasets[`player-${quality}`])
						GetUrl.url[`${quality}`] =
							datasets[`player-${quality}`];
				});
				resolve(GetUrl.url);
				return;
			});
		});
	};

	api.Parse = parse;
	api.GetUrl = GetUrl;

	return api;
};
