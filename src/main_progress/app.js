const {app, BrowserWindow, Menu, dialog, screen, ipcMain} = require('electron')
const child = require('child_process').execFile;
const path = require('path');
const {ipc_main} = require("./ipc_main");
const createWindow = require("./windows/main_window");
const createMenu = require("./menu");
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

ipc_main()

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
        createMenu(mainWindow, all_window)
        // append window
        all_window['mainWindow'] = mainWindow

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })
    }
)


app.commandLine.appendSwitch("disable-site-isolation-trials");
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

