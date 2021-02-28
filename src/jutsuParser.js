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
					return getEpisode[season][episode];
				};

				let i = 0;

				document
					.querySelectorAll("a.short-btn.video.the_hildi")
					.forEach((el) => {
						i++;
						console.log(i);
						const episode = el.href
							.replace(/^\/|(.html)|(season-)|(episode-)/g, "")
							.split("/");

						getEpisode[(episode[1], episode[2])] = {
							name: episode[0],
							season: episode[1],
							episode: episode[2],
							url: {},
						};
						axios.get(`https://jut.su${el.href}`).then((res) => {
							const docEpisode = new JSDOM(res.data).window
								.document;
							const datasets = docEpisode.querySelector(
								"span#wap_player_1"
							).dataset;
							const qualities = [
								160,
								240,
								360,
								480,
								720,
								1080,
								1440,
								2480,
							];

							qualities.forEach((quality) => {
								console.log(getEpisode.url);
								if (datasets[`player-${quality}`])
									getEpisode.url[`${quality}`] =
										datasets[`player-${quality}`];
							});
							i--;
							console.log(i);
						});
					});
				const WaitEnd = () => {
					if (i === 0) {
						resolve(getEpisode);
						return;
					}
					setTimeout(WaitEnd, 100);
				};

				WaitEnd();
			});
		});
	};

	api.Parse = parse;

	return api;
};
