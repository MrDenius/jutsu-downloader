const { app, BrowserWindow, ipcMain } = require("electron");
const jutsuParser = require("./jutsuParser")();
const downloader = require("./downloader")();
const cli = require("cli");

let win;

const Main = () => {
	console.log("START");
	//CreateWindow();
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

const CreateWindow = () => {
	win = new BrowserWindow({
		width: 1000,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			devTools: true,
		},
	});

	win.webContents.on("will-navigate", (event, url) => {
		console.log(url);
	});
};

app.whenReady().then(Main);
