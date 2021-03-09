const chalk = require("chalk");
const terminalKit = require("terminal-kit");
const term = terminalKit.terminal;
const readline = require("readline");

const jutsuParser = require("./jutsuParser")();
const downloader = require("./downloader")();
const downloadManager = require("./downloadManager")();

const log = require("./loger")();

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const FPS_MAX = 30;
const FRAME_MS = 1000 / FPS_MAX;

module.exports = () => {
	const api = () => {};

	const globalConfig = {
		Scene: "Logo",
		Name: "JUT.SU Downloader",
		Version: "0.1",
	};

	const Debug = {
		enable: true,
		reDrawCount: 0,
		Draw: () => {
			term(
				chalk.bgHex("#A6A600").hex("#B200B2")(
					`DEBUG: ReDrawCount: ${Debug.reDrawCount++}\n`
				)
			);
		},
	};

	let sceneConfig;

	const DrawScene = () => {
		term.clear();

		Debug.enable ? Debug.Draw() : undefined;

		Scenes[globalConfig.Scene].Draw();
	};

	const ChangeScene = (sceneName) => {
		if (Scenes[globalConfig.Scene] && Scenes[globalConfig.Scene].Disponse)
			Scenes[globalConfig.Scene].Disponse();

		globalConfig.Scene = sceneName;
		sceneConfig = Scenes[globalConfig.Scene].config;

		DrawScene();
	};

	const StartDrawLoop = () => {
		console.log("Loading scenes...");
		InitScenes();
		term.hideCursor();
		ChangeScene("Logo");
		setTimeout(() => {
			ChangeScene("ChangeMode");
		}, 0);
	};

	const InitScenes = () => {
		let config;
		const ChangeSceneConfig = (sceneName) => {
			Scenes[sceneName].config = Scenes[sceneName].config || {};
			config = Scenes[sceneName].config;
			console.log(Scenes[sceneName].config);
		};

		//Scene Logo
		ChangeSceneConfig("Logo");

		config.Name = globalConfig.Name;
		config.Version = globalConfig.Version;

		//Scene ChangeMode
		ChangeSceneConfig("ChangeMode");

		config.mods = [];
		config.mods.callbacks = [];

		const AddMode = (mode, callback) => {
			config.mods.push(mode);
			config.mods.callbacks.push(callback);
		};

		AddMode("Add new task.", () => {
			ChangeScene("NewTask");
		});

		AddMode("Show download list.", () => {
			ChangeScene("DownloadList");
		});

		AddMode("Exit.", () => {
			process.exit(0);
		});

		//Scene NewTask
		ChangeSceneConfig("NewTask");

		config.GetSEManager = (url) => {
			return new Promise((resolve, reject) => {
				jutsuParser.Parse(url).then((SE) => {
					const Manager = {
						blackList: [],
						episodes: [],
						GetEpisodes: () => {
							const episodes = [];
							Manager.episodes.forEach((episode) => {
								if (
									!Manager.blackList.includes(
										`${episode.season}-${episode.episode}`
									) &&
									episode
								)
									episodes.push(episode);
							});

							episodes.GetSettings = (quality) => {
								const dowSettings = [];
								log(quality);

								for (const i in episodes) {
									if (typeof episodes[i] === typeof {}) {
										episodes[i].quality = quality;
										dowSettings.push(episodes[i]);
									}
								}

								return dowSettings;
							};

							return episodes;
						},
					};

					let s = 1;
					let e = 1;
					while (true) {
						e = 1;
						let content = SE(s, e);
						if (!content) break;

						while (content) {
							Manager.episodes.push(content);

							e++;
							content = SE(s, e);
						}
						s++;
					}
					resolve(Manager);
				});
			});
		};
		config.StartDownload = (dowSettings) => {
			downloadManager.AddDownload(dowSettings);
			ChangeScene("DownloadList");
		};

		//DownloadList
		ChangeSceneConfig("DownloadList");
		downloadManager
			.on("progress", (episode, progress, speed) => {
				if (config.onProgress)
					config.onProgress(episode, progress, speed);
			})
			.on("queue-update", () => {
				DrawScene();
			});
		config.title = {
			get: () => config.title.value,
			set: (value) => {
				if (value != config.title.value) {
					config.title.value = value;
					DrawScene();
				}
			},
			value: "Loading...",
		};

		console.log(chalk.green("Scenes config loaded!"));
		log("Scenes config loaded!");
	};

	process.stdin.on("keypress", (str, key) => {
		//console.log(key);
		if (key && key.ctrl && key.name == "c") process.exit(0);
	});

	const Scenes = {
		Logo: {
			Draw: () => {
				term(`${chalk.cyan(sceneConfig.Name)}\n`);
				term(`version ${chalk.gray(sceneConfig.Version)}\n`);
			},
		},
		ChangeMode: {
			Draw: () => {
				term("Choose a mode.");
				term.singleColumnMenu(sceneConfig.mods, (error, response) => {
					sceneConfig.mods.callbacks[response.selectedIndex]();
				});
			},
		},
		NewTask: {
			Draw: () => {
				term("Enter url: ");
				term.inputField((error, input) => {
					input = "https://jut.su/grand-blue/";
					sceneConfig.GetSEManager(input).then((Manager) => {
						const DrawEpisodes = () => {
							term.clear();
							const whiteEp = Manager.GetEpisodes();
							Manager.episodes.forEach((ep) => {
								let color = chalk.red;
								if (whiteEp.includes(ep)) color = chalk.green;
								term(
									color(
										`${ep.name} ${ep.season}-${ep.episode}\n`
									)
								);
							});
							term(
								`\nВведите S-E для добавления/удаления в blacklist.\nНажмите ENTER чтобы продолжить.\n`
							);
							term.inputField((error, input) => {
								//Выбор качества
								if (input === "") {
									term.clear();
									term("Loading qualities...");
									Manager.GetEpisodes()[0]
										.getUrl()
										.then((qualities) => {
											const qualityList = [];
											Object.entries(qualities).forEach(
												(entrie) => {
													qualityList.push(
														entrie[0] + "p"
													);
												}
											);

											term.clear();
											term.singleColumnMenu(
												qualityList,
												(error, response) => {
													const dowSettings = Manager.GetEpisodes().GetSettings(
														qualityList[
															response
																.selectedIndex
														].replace("p", "")
													);
													term.clear();
													sceneConfig.StartDownload(
														dowSettings
													);
													term.clear();
													term("Loading...");
												}
											);
										});
								}
								const s_e = input.split("-");
								if (
									s_e.length === 1 &&
									!Number.isNaN(Number(s_e[0]))
								) {
									Manager.blackList.push(`1-${s_e[0]}`);
								} else {
									Manager.blackList.push(
										`${s_e[0]}-${s_e[1]}`
									);
								}
								if (input !== "") DrawEpisodes();
							});
						};
						DrawEpisodes();
					});
				});
			},
		},
		DownloadList: {
			Draw: () => {
				const dowInfo = downloadManager.GetDownloadInfo();
				let i = 0;
				dowInfo.queue.forEach((q) => {
					term(`Queue #${i++}\n`);
					q.episodes.forEach((episode) => {
						const episodeName = `${episode.season}-${episode.episode} ${episode.name}`;

						const GetColor = () => {};

						term(`--${episodeName}\n`);
					});
				});
				if (dowInfo.queue.length !== 0) {
					const progressBar = term.progressBar({
						width: undefined,
						title: sceneConfig.title.value,
						eta: true,
						percent: true,
						titleSize: sceneConfig.title.value.length + 2 || 7 + 10,
						syncMode: true,
					});
					if (sceneConfig.pb) sceneConfig.pb.stop();
					sceneConfig.pb = progressBar;

					sceneConfig.onProgress = (episode, progress, speed) => {
						const newScenTitle = `${episode.season}-${episode.episode} ${episode.name}`;

						sceneConfig.title.set(newScenTitle);

						progressBar.update({
							progress: progress / 100,
						});
						// progressBar.update(progress / 100);
					};
				}
			},
			disponseList: [],
			Disponse: () => {
				Scenes.DownloadList.disponseList.forEach((obj) => {
					obj.Disponse();
				});
			},
		},
	};

	api.DrawScene = DrawScene;
	api.StartDrawLoop = StartDrawLoop;

	return api;
};
