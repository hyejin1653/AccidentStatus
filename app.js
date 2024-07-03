const { json, request } = require("express");
const express = require("express");
const app = express();
var cor = require("cors");
let fs = require("fs");
const path = require("path");
var WebSocket = require("ws");
var WebSocketServer = WebSocket.Server,
  wss = new WebSocketServer({ port: 5006 });

let sendData = [
  // {
  //   mmsi: 351430000,
  //   shipName: "DD VOGUE",
  //   callSign: "3EPG4",
  //   imoNo: 9357456,
  // },
  // {
  //   mmsi: 441797000,
  //   shipName: "재원9호",
  //   callSign: "6KCA4",
  //   imoNo: 8806228,
  // },
  // {
  //   mmsi: 441811000,
  //   shipName: "제6경양호",
  //   callSign: "6KCA6",
  //   imoNo: 8734255,
  // },
  // {
  //   mmsi: 218566000,
  //   shipName: "LUDWIGSHAFEN EXPRESS",
  //   callSign: "DDOR2",
  //   imoNo: 9613018,
  // },
  {
    mmsi: 441008000,
    shipName: "진안호",
    callSign: "068821",
    imoNo: 9358357,
  },
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

let chageValue = true;
let startFlag = true;
var value = 0;
function dataForm() {
  let obj = {};
  var floatNumber = Math.random();
  var flooding; //침수상태
  //var value; //횡경사
  var level; //사고등급

  //침수상태
  flooding = floatNumber < 0.5 ? 0 : 1;
  //횡경사
  //value = ((Math.floor(Math.random() * 20)) + floatNumber).toFixed(2);

  //50이상이면 반대로 회전하기위함
  if (value > 20) {
    chageValue = false;
  }

  //사고등급
  level = 0;

  // if (chageValue) {
  //   value = rand(0, 20);
  // } else {
  //   value = rand(-20, 0);

  //   if (value == -20) {
  //     chageValue = true;
  //   }
  // }

  value = rand(-20, 20);

  //양수
  if (value < 7 && flooding == 0) {
    level = 0; //정상 7도 미만에 침수없을 경우 정상
  } else if (value < 7 && flooding == 1) {
    level = 1; //심각한
  } else if (value < 20) {
    level = 2; //중대한
  } else if (value >= 20) {
    level = 3; //치명적
  }

  //음수
  if (0 > value && value > -7 && flooding == 0) {
    level = 0; //정상 7도 미만에 침수없을 경우 정상
  } else if (0 > value && value > -7 && flooding == 1) {
    level = 1; //심각한
  } else if (-7 >= value && value > -20) {
    level = 2; //중대한
  } else if (value <= -20) {
    level = 3; //치명적
  }

  //console.log(value, level);

  if (level > 1) {
    flooding = 1;
  }

  obj["LEVEL"] = level;
  obj["VALUE"] = value;
  obj["FLOODING"] = flooding;

  //console.log(data);
  //resultData.push(data);

  return obj;
  //jsonForm = JSON.stringify(object);
}

//log파일생성
// function createLogFile(count, dataSet) {
//   //console.log(count, dataSet);

//   let resultStr =
//     count +
//     ", " +
//     dataSet.VALUE +
//     ", " +
//     dataSet.FLOODING +
//     ", " +
//     dataSet.LEVEL +
//     ", " +
//     dataSet.mmsi;
//   //let resultStr = JSON.stringify(dataSet);

//   console.log(resultStr);

//   let folderPath = path.join(__dirname, "LOG");

//   let dt = new Date();
//   dt =
//     dt.getFullYear() +
//     "-" +
//     ("0" + (dt.getMonth() + 1)).slice(-2) +
//     "-" +
//     ("0" + dt.getDate()).slice(-2);

//   let filePath = path.join(folderPath, dt + ".log");

//   const directory = fs.existsSync(folderPath);
//   if (!directory) {
//     fs.mkdirSync(folderPath);
//   }

//   fs.stat(filePath, (err, stats) => {
//     //console.log(err);
//     if (err === null) {
//       //console.log("파일이 존재합니다.");
//       fs.appendFileSync(filePath, "\r\n" + resultStr, (err) =>
//         console.log(err)
//       );
//     } else {
//       //file 존재 안할때
//       //console.log("파일이 존재안합니다.");
//       fs.writeFileSync(filePath, resultStr, (err) => console.log(err));
//     }
//   });

//   //const exifile = await fs.existsSync(realPath)
// }

let timer, time;
let originData = null;
let dataArr = [];
function sendDt() {
  dataArr = [];
  let obj = dataForm();

  for (let data of sendData) {
    Object.assign(data, obj);
    dataArr.push(data);
  }

  dataArr = JSON.stringify(dataArr);

  let level = obj.LEVEL;
  let eventLevel = undefined;

  if (originData != undefined) {
    eventLevel = originData.LEVEL;
  }

  if (level == 0) {
    //등급마다 보내는 시간이 다름
    time = 60;
  } else if (level == 1) {
    time = 30;
  } else if (level == 2) {
    time = 10;
  } else if (level == 3) {
    time = 3;
  }

  //등급이 변하면 바로 전송
  if (eventLevel != level && eventLevel != undefined) {
    time = 1;
  }

  console.log(dataArr, time);

  originData = obj;

  clearInterval(timer);
  timer = setInterval(sendDt, 1000 * time);

  //console.log(dataArr, time);
}

timer = setInterval(sendDt, 1000);

wss.on("connection", (ws, request) => {
  if (ws.readyState === ws.OPEN) {
    console.log("접속");
    //setInterval(() => ws.send(dataArr),);
    ws.send(dataArr);

    function wsSend() {
      ws.send(dataArr);
    }

    let wsInterval;
    if (wsInterval != undefined) {
      clearInterval(wsInterval);
    }
    wsInterval = setInterval(wsSend, 1000);
  }

  ws.onclose = () => {
    console.log("접속종료");
    clearInterval(timer);
  };
});

// app.post("/fileCreate", (req, res) => {
//   console.log(req);
//   res.send("ok");
// });

const port = 6000;
app.listen(port, () => {
  console.log(
    `Example app listening at http://localhost:${port}  ws://5006 사고정보 시뮬레이터`
  );
});

//websocket통신
/*wss.on('connection', (ws, request)=>{
  if(ws.readyState === ws.OPEN)
  {
    console.log('새로운 클라이언트');
    var result = [];
    var myFunction = function(){
        
        if(jsonForm != undefined)
        {
            //기존 등급과 비교하기 위함
            eventLevel = JSON.parse(jsonForm).ACCIDENT[0].LEVEL;
        }
        
        dataForm('auto');
        var level = JSON.parse(jsonForm).ACCIDENT[0].LEVEL;

        //등급마다 보내는 시간이 다름
        if(level == 0){
            time = 60;
        }else if(level == 1){
            time = 30;
        }else if(level == 2){
            time = 10;
        }else if(level == 3){
            time = 3;
        }

        //등급이 변하면 바로 전송
        if(eventLevel != level && eventLevel != undefined)
        {
            time = 1;
        }

        intervalAuto = setInterval(myFunction, 1000 * time);
    }

    intervalAuto = setInterval(myFunction, 1000 * time);
    

  }
})

const port = 6000
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

*/

//dataForm();
