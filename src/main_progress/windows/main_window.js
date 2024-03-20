const {BrowserWindow, screen} = require('electron')
function createWindow() {
    const mainScreen = screen.getPrimaryDisplay();
    const allScreens = screen.getAllDisplays();
    // 如果有多个屏幕，选择第二个屏幕
    const secondScreen = allScreens.length > 1 ? allScreens[1] : mainScreen;

    // Create the browser window.
    let mainWindow = new BrowserWindow({
        width: 800,
        height: 600,

        webPreferences: {
            // webSecurity: true,
            nodeIntegration: true,
            contextIsolation: false,
        },
        x: secondScreen.bounds.x + 50,  // 调整X坐标以适应您的需求
        y: secondScreen.bounds.y + 50   // 调整Y坐标以适应您的需求
    })

    // and load the hello.html of the app.
    mainWindow.loadFile('src/pages/index/index.html')
    // 将窗口设置为全屏
    // 将窗口最大化
    mainWindow.maximize();
    //如果为开发环境
    if (process.env.NODE_ENV === 'dev') {
        // Open the DevTools.
        mainWindow.webContents.openDevTools()
    }

    return mainWindow;

}

module.exports = createWindow