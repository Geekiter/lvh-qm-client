const {app, dialog, Menu} = require('electron')
const fse = require('fs-extra');
const {join} = require("path");

function sync_file(filePath) {

    // 转换文件路径风格
    const newFilePath = filePath.replace(/\\/g, '/')
    // 缓存目录路径，你可以根据需要更改
    const cacheDirectory = app.getPath('userData');

    console.log(cacheDirectory)

    // 获取文件名
    const fileName = newFilePath.split('/').pop()
    // 拼接缓存目录下的文件路径
    const cacheFilePath = join(cacheDirectory, fileName)
    // 将文件复制到缓存目录
    fse.copyFileSync(newFilePath, cacheFilePath)
    return cacheFilePath
}

function createMenu(mainWindow, allWindow) {
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
                        {name: 'Videos', extensions: ['webm']}
                    ],
                    properties: ['openFile']
                }
                dialog.showOpenDialog(options)
                    .then(function (fileObj) {
                        // the fileObj has two props
                        if (!fileObj.canceled) {
                            // mainWindow.webContents.send('FILE_OPEN', fileObj.filePaths)
                            const cacheFilePath = sync_file(fileObj.filePaths[0])
                            mainWindow.webContents.send('FILE_OPEN', [cacheFilePath])
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
        }
        // }, {
        //
        //     label: "实时监测",
        //     click() {
        //         // 创建一个新的窗口
        //         let cameraWindow = createCameraWindow()
        //         allWindow['cameraWindow'] = cameraWindow
        //         // 监听窗口关闭事件
        //         cameraWindow.on('closed', () => {
        //             cameraWindow = null
        //         })
        //
        //     }
        // }
    ]
    const menu = Menu.buildFromTemplate(menuBar)
    Menu.setApplicationMenu(menu)
}

module.exports = createMenu