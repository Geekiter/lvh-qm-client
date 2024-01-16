const fs = require('fs');
const {app, BrowserWindow, Menu, dialog, ipcMain, ipcRenderer, screen} = require('electron')
const child = require('child_process').execFile;
const path = require('path');
// 热更新忽略目录
// workplace
const ignore = [
    'workspace'
]
// hot reload
try {
    require('electron-reloader')(module, {ignore});
} catch (_) {
    print("reload error")
}

let all_window = {}

function createMenu(mainWindow) {
    // 初始化菜单
    const menuBar = [
        {
            label: "导入视频",
            click() {
                // construct the select file dialog
                // 只允许选择图片
                const options = {
                    title: '选择左心室肥厚视频',
                    filters: [
                        {name: 'Images', extensions: ['mp4', 'avi', 'wav']}
                    ],
                    properties: ['openFile']
                }
                dialog.showOpenDialog(options)
                    .then(function (fileObj) {
                        // the fileObj has two props
                        if (!fileObj.canceled) {
                            mainWindow.webContents.send('FILE_OPEN', fileObj.filePaths)
                        }
                    })
                    // should always handle the error yourself, later Electron release might crash if you don't
                    .catch(function (err) {
                        console.error(err)
                    })
            }

        }, {
            label: "打开分割模型",
            click() {
                // construct the select file dialog
                // 只允许选择图片
                const options = {
                    title: '选择模型文件',
                    filters: [
                        {name: 'Model'}
                    ],
                    properties: ['openFile']
                }
                dialog.showOpenDialog(options)
                    .then(function (fileObj) {
                        if (!fileObj.canceled) {
                            mainWindow.webContents.send('open_model', ['segment_model_path', fileObj.filePaths])
                        }
                    })
                    .catch(function (err) {
                        console.error(err)
                    })
            }
        }, {
            label: "实时监测",
            click() {
                // 创建一个新的窗口
                let cameraWindow = createCameraWindow()
                all_window['cameraWindow'] = cameraWindow
                // 监听窗口关闭事件
                cameraWindow.on('closed', () => {
                    cameraWindow = null
                })

            }
        }
    ]
    const menu = Menu.buildFromTemplate(menuBar)
    Menu.setApplicationMenu(menu)
}
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
            nodeIntegration: true,
            contextIsolation: false,
        },
        x: mainScreen.bounds.x + 50,  // 调整X坐标以适应您的需求
        y: mainScreen.bounds.y + 50   // 调整Y坐标以适应您的需求
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


ipcMain.on("camera_img", (event, arg) => {
    // arg为base64编码的图片
    // 创建文件夹
    // 获取桌面路径
    let desktopPath = app.getPath('desktop');
    const outputDir = path.join(desktopPath, 'skin_detect_camera_output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }
    // 获取当前时间戳
    const timestamp = Date.now();
    // 拼接文件名
    const filename = `${timestamp}.png`;
    const filepath = path.join(outputDir, filename);
    const base64Data = arg.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    // 写入文件
    fs.writeFileSync(filepath, buffer);
    // send to ipc event "FILE_OPEN"
    all_window['mainWindow'].webContents.send('FILE_OPEN', [filepath])

});

// 创建一个摄像头实时获取窗口
function createCameraWindow() {
    let cameraWindow = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })
    cameraWindow.loadFile('src/pages/camera.html')
    if (process.env.NODE_ENV === 'dev') {
        // Open the DevTools.
        cameraWindow.webContents.openDevTools()
    }
    // 菜单为空
    cameraWindow.setMenu(null)
    return cameraWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
        // 启动运行目录下的resources下的的skin_drp_server.exe
        //获取当前运行目录
        const appPath = path.dirname(process.execPath);
        //如果是开发环境，就启动同目录下的skin_drp_server.exe
        let executablePath;
        console.log(process.env.NODE_ENV)
        if (process.env.NODE_ENV === 'dev') {
            // executablePath = 'skin_drp_server.exe';
        } else {
            //如果是生产环境，就启动resources下的skin_drp_server.exe
            executablePath = path.join(appPath, 'resources', 'skin_drp_server.exe');
            child(executablePath, function (err, data) {
                if (err) {
                    console.error(err);
                    return;
                }

                console.log(data.toString());
            });
        }


        // 创建窗口
        let mainWindow = createWindow()
        createMenu(mainWindow)
        // append window
        all_window['mainWindow'] = mainWindow


        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })
    }
)


app.commandLine.appendSwitch("disable-site-isolation-trials");
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

