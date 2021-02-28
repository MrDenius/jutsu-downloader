const { app, BrowserWindow, ipcMain } = require("electron");

let win;

const Main = () => {
	CreateWindow();
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
