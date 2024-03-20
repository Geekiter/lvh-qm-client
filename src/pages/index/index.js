const {ipcRenderer} = require('electron')
const Highcharts = require('../../static/highcharts/highcharts.js');
// let source_path = "C:\\Users\\alber\\dev\\py\\lvh-qm-server\\Image08.avi"
// let current_path = source_path
ipcRenderer.on("FILE_OPEN", (event, args) => {
    const filePath = args[0]
    video.src = filePath;
    localStorage.setItem("source_path", filePath)
    localStorage.setItem("current_path", filePath)
    label_default()
})
let chart = null;
const video = document.getElementById('video-player');
const playPauseButton = document.getElementById('play-pause');
const nextFrameButton = document.getElementById('next-frame');
const prevFrameButton = document.getElementById('prev-frame');
const trackButton = document.getElementById('track');
playPauseButton.addEventListener('click', togglePlayPause);
nextFrameButton.addEventListener('click', playNextFrame);
prevFrameButton.addEventListener('click', playPrevFrame);
trackButton.addEventListener('click', track_from_json);

let id_arr = {}
// 获取index.html工具栏元素id
id_arr['bri_a1'] = document.getElementById('bri_a1')
id_arr['bri_b1'] = document.getElementById('bri_b1')
id_arr['smooth_frame1'] = document.getElementById('smooth_frame1')
id_arr['gamma1'] = document.getElementById('gamma1')
id_arr['equal_switch'] = document.getElementById('equal_switch')
id_arr['edge_switch'] = document.getElementById('edge_switch')
id_arr['sharpen_level1'] = document.getElementById('sharpen_level1')

id_arr['bri_a_l'] = document.getElementById('bri_a_l')
id_arr['bri_b_l'] = document.getElementById('bri_b_l')
id_arr['smooth_l'] = document.getElementById('smooth_l')
id_arr['gamma_l'] = document.getElementById('gamma_l')
id_arr['sharpen_l'] = document.getElementById('sharpen_l')
id_arr['contour_switch'] = document.getElementById('contour_switch')


let default_value = {
    bri_a1: 1,
    bri_b1: 0,
    smooth_frame1: 0,
    gamma1: 1,
    equal_switch: false,
    edge_switch: false,
    sharpen_level1: 0,
    contour_switch: false
}
let range_label = {
    bri_a1: id_arr['bri_a_l'],
    bri_b1: id_arr['bri_b_l'],
    smooth_frame1: id_arr['smooth_l'],
    gamma1: id_arr['gamma_l'],
    sharpen_level1: id_arr['sharpen_l']
}

//将range_label对象的range值赋给label
function label_bind() {
    for (let key in range_label) {
        range_label[key].innerHTML = id_arr[key].value
    }
}

//label default
function label_default() {
    key_arr = {
        model_path: "默认：Yolo V8",
        source_path: "默认：Image08.avi",
    }

    for (let key in key_arr) {
        let value = localStorage.getItem(key)
        if (value === null) {
            value = key_arr[key]
        }
        document.getElementById(key).innerHTML = value
    }
}

//数值初始化
function value_init() {
    label_bind()
//遍历id_arr，为每个元素添加change事件
    for (let key in id_arr) {
        // 初始化参数值
        try {
            id_arr[key].value = default_value[key]
        } catch (e) {
            console.log(e)
            console.log(id_arr[key])
        }

        id_arr[key].addEventListener('input', label_bind)
    }
//    模型路径初始化
    label_default()
}


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

function track_from_json() {
    json_data_file_path = "./fake_data.json"
    fetch(json_data_file_path, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(res => res.json())
        .then(data => {
            console.log(data)
            for (let i = 0; i < data["down"].length; i++) {
                data["down"][i] /= 10
                data["up"][i] /= 10
            }
            update_highchart_data(data["down"], data["up"])
        })

}

function track() {
    fetch_url = "http://localhost:16000/api/track"
    json_data = {
        "file_path": "C:\\Users\\alber\\dev\\data\\lvh\\40320484肥厚\\Image08.avi"
    }
    // return data structure
    /**
     * {
     *     "down": [1,2,3],
     *     "up": [1,2,3],
     *     "file_path": "C:\\Users\\alber\\dev\\data\\lvh\\40320484肥厚\\Image08.avi"
     * }
     */
    fetch(fetch_url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(json_data)
    }).then(res => res.json())
        .then(data => {
            console.log(data)
            init_chart_highchart(data["down"], data["up"])
        })
}

const plugin = {
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart, args, options) => {
        const {ctx} = chart;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = options.color || '#99ffff';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    }
};

function init_chart(point_in, point_out) {
    // point_in = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    // point_out = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5]
    const labels = []
    for (let i = 0; i < point_in.length; i++) {
        labels.push(i.toString())
    }

    const ctx = document.getElementById('myChart');

    new Chart(ctx,
        {
            type: 'line',
            data: {
                datasets: [{
                    data: point_in,
                    label: '内轮廓',
                }, {
                    data: point_out,
                    label: '外轮廓',
                }],
                labels: labels
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    customCanvasBackgroundColor: {
                        color: 'lightGreen',
                    }
                }
            },
            plugins: [plugin],
        });
}

function init_chart_highchart(point_in, point_out) {

    point_in = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,]
    point_out = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5,]
    const labels = []
    for (let i = 0; i < point_in.length; i++) {
        labels.push(i.toString())
    }

    document.addEventListener('DOMContentLoaded', function () {
        chart = Highcharts.chart('container', {

            credits: {enabled: false}, // 禁用版权信息
            chart: {
                type: 'area',
            },
            title: {
                text: '',
            },
            xAxis: {
                categories: labels
            },
            yAxis: {
                title: {
                    text: 'Thickness'
                }
            },
            series: [{
                name: '上部厚度',
                data: point_in
            }, {
                name: '下部厚度',
                data: point_out
            }],
            plotOptions: {
                area: {
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        radius: 2,
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    }
                }
            },
        });
    });
}

function update_highchart_data(point_in, point_out) {
    chart.series[0].setData(point_in);
    chart.series[1].setData(point_out);
}


function video_filters() {
    filters_url = "http://localhost:16000/api/filters"
    json_data = {
        "bri_a1": id_arr['bri_a1'].value,
        "bri_b1": id_arr['bri_b1'].value,
        "smooth_frame1": id_arr['smooth_frame1'].value,
        "gamma1": id_arr['gamma1'].value,
        "equal_switch": id_arr['equal_switch'].checked,
        "edge_switch": id_arr['edge_switch'].checked,
        "sharpen_level1": id_arr['sharpen_level1'].value,
        "contour_switch": id_arr['contour_switch'].checked,
        "file_path": localStorage.getItem("source_path")
    }
    fetch(filters_url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(json_data)
    }).then(res => res.json())
        .then(data => {
            console.log(data)
            file_path = data["file_path"]
            file_path = "file:///" + file_path
            localStorage.setItem("current_path", file_path)
            video.src = file_path
        })

}

init_chart_highchart()
track_from_json()
value_init()