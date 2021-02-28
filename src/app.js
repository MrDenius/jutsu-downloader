const { app, BrowserWindow, ipcMain } = require("electron");
const jutsuParser = require("./jutsuParser")();

let win;

const Main = () => {
	console.log("START");
	//CreateWindow();
	jutsuParser
		.Parse("https://jut.su/darling-in-the-franxx/")
		.then(console.log);
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
