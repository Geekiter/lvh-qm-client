const {ipcMain, app} = require('electron');
const fs = require('fs');
const fse = require('fs-extra');

function ipc_main() {
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

    ipcMain.on('FILE_OPEN', (event, args) => {
        console.log("FILE_OPEN!")
        // 文件路径
        const filePath = args[0]
        // 转换文件路径风格
        const newFilePath = filePath.replace(/\\/g, '/')
        // 缓存目录路径，你可以根据需要更改
        const cacheDirectory = app.getPath('userData');

        console.log(cacheDirectory)

        // 获取文件名
        const fileName = newFilePath.split('/').pop()
        // 拼接缓存目录下的文件路径
        const cacheFilePath = path.join(cacheDirectory, fileName)
        // 将文件复制到缓存目录
        fse.copyFileSync(newFilePath, cacheFilePath)
    })
}

module.exports = {
    ipc_main
}