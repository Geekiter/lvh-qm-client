
// 创建一个摄像头实时获取窗口
import {BrowserWindow} from "electron";

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

export default createCameraWindow