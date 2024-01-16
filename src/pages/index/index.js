const {ipcRenderer} = require('electron')
// 导入fs
const fs = require('fs')

//base64 to img
function base64ToImg(base64) {
    // 去掉base64头部
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
    // 生成图片路径
    const dataBuffer = Buffer.from(base64Data, 'base64')
    return dataBuffer
}

//img to base64
function imgToBase64(img) {
    let image
    // 读取图片文件
    try {
        image = fs.readFileSync(img, 'base64')
    } catch (e) {
        console.log(e)
    }
    // 将图片转换为base64
    const base64 = `data:image/png;base64,${image}`
    return base64
}

let id_arr = {}
// 获取index.html工具栏元素id
id_arr['bri_a1'] = document.getElementById('bri_a1')
id_arr['bri_b1'] = document.getElementById('bri_b1')
id_arr['smooth_frame1'] = document.getElementById('smooth_frame1')
id_arr['gamma1'] = document.getElementById('gamma1')
id_arr['equal_switch'] = document.getElementById('equal_switch')
id_arr['edge_switch'] = document.getElementById('edge_switch')
id_arr['sharpen_level1'] = document.getElementById('sharpen_level1')
id_arr['hair_switch'] = document.getElementById('hair_switch')

id_arr['bri_a_l'] = document.getElementById('bri_a_l')
id_arr['bri_b_l'] = document.getElementById('bri_b_l')
id_arr['smooth_l'] = document.getElementById('smooth_l')
id_arr['gamma_l'] = document.getElementById('gamma_l')
id_arr['sharpen_l'] = document.getElementById('sharpen_l')
id_arr['contour_switch'] = document.getElementById('contour_switch')
const preview_img = document.getElementById('preview_img')

// 从localStorage中获取work的值，即图片路径
const work = localStorage.getItem('work')
// 如果work不为空，则将图片路径写入preview_img标签的background-image属性
if (work) {
    //work to base64
    const base64 = imgToBase64(work)
    preview_img.style.backgroundImage = `url(${base64})`
}


let default_value = {
    bri_a1: 1,
    bri_b1: 0,
    smooth_frame1: 0,
    gamma1: 1,
    equal_switch: false,
    edge_switch: false,
    sharpen_level1: 0,
    hair_switch: false,
    contour_switch: false
}
let range_label = {
    bri_a1: id_arr['bri_a_l'],
    bri_b1: id_arr['bri_b_l'],
    smooth_frame1: id_arr['smooth_l'],
    gamma1: id_arr['gamma_l'],
    sharpen_level1: id_arr['sharpen_l']

}
//数值初始化
value_init()


ipcRenderer.on('FILE_OPEN', (event, args) => {
    // 文件路径
    const filePath = args[0]
    // 转换文件路径风格
    const newFilePath = filePath.replace(/\\/g, '/')

    //base64编码
    const base64 = fs.readFileSync(newFilePath, {encoding: 'base64'})

    // 将新的文件路径写入preview_img标签的background-image属性
    preview_img.style.backgroundImage = `url(data:image/jpg;base64,${base64})`
    // document.getElementById('preview_img').style.backgroundImage = `url(${newFilePath})`
    // 将文件路径保存到localStorage中，key为work，value为文件路径
    localStorage.setItem('work', newFilePath)

    value_init()

})

//label default
function label_default() {
    key_arr = {
        model_path: "默认：Resnet18",
        label_path: "默认：ImageNetV1 1000分类",
        segment_model_path: "默认：DeepLabV3+",
    }

    for (let key in key_arr) {
        let value = localStorage.getItem(key)
        if (value === null) {
            value = key_arr[key]
        }
        document.getElementById(key).innerHTML = value
    }
}

ipcRenderer.on("open_model", (e, a) => {
    let key = a[0]
    let value = a[1][0]
    localStorage.setItem(key, value)
    label_default()
})

//数值初始化
function value_init() {
    label_bind()
//遍历id_arr，为每个元素添加change事件
    for (let key in id_arr) {
        // 初始化参数值
        id_arr[key].value = default_value[key]

        id_arr[key].addEventListener('input', img_process)
    }
//    模型路径初始化
    label_default()
    img_process()
}

function img_process() {
    label_bind()
    // 图片文件转为base64
    const img = localStorage.getItem('work')
    let imgData
    try {
        imgData = fs.readFileSync(img, {encoding: 'base64'})
    } catch (e) {
        console.log(e)
    }
    fetch('http://127.0.0.1:15000/api/img_process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bri_a1: id_arr['bri_a1'].value,
                bri_b1: id_arr['bri_b1'].value,
                smooth_frame1: id_arr['smooth_frame1'].value,
                gamma1: id_arr['gamma1'].value,
                equal_switch: id_arr['equal_switch'].checked,
                edge_switch: id_arr['edge_switch'].checked,
                sharpen_level1: id_arr['sharpen_level1'].value,
                hair_switch: id_arr['hair_switch'].checked,
                contour_switch: id_arr['contour_switch'].checked,
                imgData: localStorage.getItem('work')
            }),

        }
    )
        .then((res) => {
            // 返回的是base64
            return res.text()

        })
        .then((res) => {
            // 将base64转为图片
            const img = document.getElementById('preview_img')
            img.style.backgroundImage = `url(data:image/jpg;base64,${res})`
        })


}

function null2str(str) {
    if (str === null)
        return ""
    else
        return str
}

// 图片预测函数，post请求
function predict() {
//    从preview_img标签中获取图片路径
    const img = preview_img.style.backgroundImage
    const imgData = img.split(',')[1]
    // 发送图片预测http post请求，参数为图片路径，返回json,pred为预测结果
    fetch('http://127.0.0.1:15000/api/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model_path: null2str(localStorage.getItem('model_path')),
            label_path: null2str(localStorage.getItem('label_path')),
            imgData: imgData
        })
    })
        .then((res) => {
            return res.json()
        })
        .then((res) => {
                // 将预测结果写入result标签
                document.getElementById('result').innerHTML = res.label
                // 将remark写入remark标签
                if (res.remark !== "") {
                    document.getElementById('remark').innerHTML = res.remark
                } else {
                    //    嵌入bing搜索,UA为安卓手机，没有滚动条
                    document.getElementById('remark').innerHTML = `<iframe src="https://cn.bing.com/search?q=${res.label}&ensearch=1&FORM=BEHPTB&ensearch=1&UA=android"  style="width: 100%;height: 100%"></iframe>`
                }
            }
        )
}

function segmentation() {
    //    从preview_img标签中获取图片路径
    const img = preview_img.style.backgroundImage
    const imgData = img.split(',')[1]
    // 发送图片预测http post请求，参数为图片路径，返回json,pred为预测结果
    fetch('http://127.0.0.1:15000/api/segment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            segment_model_path: null2str(localStorage.getItem('segment_model_path')),
            imgData: imgData
        })
    })
        .then((res) => {
            // 返回的是base64
            return res.text()

        })
        .then((res) => {
            // 将base64转为图片
            const img = document.getElementById('preview_img')
            img.style.backgroundImage = `url(data:image/jpg;base64,${res})`
        })
}

//将range_label对象的range值赋给label
function label_bind() {
    for (let key in range_label) {
        range_label[key].innerHTML = id_arr[key].value
    }
}

const video = document.getElementById('video-player');
const playPauseButton = document.getElementById('play-pause');
const nextFrameButton = document.getElementById('next-frame');
const prevFrameButton = document.getElementById('prev-frame');
playPauseButton.addEventListener('click', togglePlayPause);
nextFrameButton.addEventListener('click', playNextFrame);
prevFrameButton.addEventListener('click', playPrevFrame);



function togglePlayPause() {
    if (video.paused) {
        video.play();
        playPauseButton.textContent = '暂停'; // 暂停符号
    } else {
        video.pause();
        playPauseButton.textContent = '播放'; // 播放符号
    }
}

function playNextFrame() {
    video.pause();
    video.currentTime += 1 / 30; // 适用于30帧每秒的视频，根据实际情况调整
}

function playPrevFrame() {
    video.pause();
    video.currentTime -= 1 / 30; // 适用于30帧每秒的视频，根据实际情况调整
}