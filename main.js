// 楽しいmicro:bitコンテスト2024応募
// 挨拶する置時計ロボのコード
let digits = [
    0xC0, // 0
    0xF9, // 1
    0xA4, // 2
    0xB0, // 3
    0x99, // 4
    0x92, // 5
    0x82, // 6
    0xF8, // 7
    0x80, // 8
    0x90  // 9
];

// 7セグ用送信
function sendByte(byte: number) {
    for (let i = 0; i < 8; i++) {
        let bit = (byte & (1 << (7 - i))) ? 1 : 0;
        pins.digitalWritePin(DigitalPin.P0, bit);
        control.waitMicros(1);
        pins.digitalWritePin(DigitalPin.P2, 1);  // シフトクロックをHIGHに
        control.waitMicros(1);
        pins.digitalWritePin(DigitalPin.P2, 0);  // シフトクロックをLOWに
    }
}

function latch() {
    pins.digitalWritePin(DigitalPin.P1, 1);  // ラッチクロックをHIGHに
    control.waitMicros(1);
    pins.digitalWritePin(DigitalPin.P1, 0);  // ラッチクロックをLOWに
}

function getLightLevel(): number {
    pins.i2cWriteNumber(0x23, 0x10, NumberFormat.UInt8BE, false);
    basic.pause(180);
    let result = pins.i2cReadNumber(0x23, NumberFormat.UInt16BE, false);
    return Math.round(result / 1.2); // luxに変換
}



function decToBcd(val: number): number {
    return ((val / 10) << 4) + (val % 10);
}

function bcdToDec(val: number): number {
    return ((val >> 4) * 10) + (val & 0x0F);
}

function readRTC(): { hours: number, minutes: number, seconds: number } {
    pins.i2cWriteNumber(0x68, 0x00, NumberFormat.UInt8BE);
    let buf = pins.i2cReadBuffer(0x68, 3);

    let seconds = bcdToDec(buf[0] & 0x7F); // マスクを適用して上位ビットを無視
    let minutes = bcdToDec(buf[1] & 0x7F); // マスクを適用して上位ビットを無視
    let hours = bcdToDec(buf[2] & 0x3F);   // マスクを適用して上位ビットを無視

    return { hours, minutes, seconds };
}

function writeRTC(hours: number, minutes: number, seconds: number) {
    let buf = pins.createBuffer(4);
    buf[0] = 0x00;
    buf[1] = decToBcd(seconds);
    buf[2] = decToBcd(minutes);
    buf[3] = decToBcd(hours);
    pins.i2cWriteBuffer(0x68, buf);
}

function displayTime(hours: number, minutes: number, seconds: number) {
    let hourTens = Math.floor(hours / 10);
    let hourOnes = hours % 10;
    let minuteTens = Math.floor(minutes / 10);
    let minuteOnes = minutes % 10;
    let secondTens = Math.floor(seconds / 10);
    let secondOnes = seconds % 10;

    sendByte(digits[hourTens]);
    sendByte(digits[hourOnes]);
    sendByte(digits[minuteTens]);
    sendByte(digits[minuteOnes]);
    sendByte(digits[secondTens]);
    sendByte(digits[secondOnes]);

    latch(); // 全桁を一度に表示
}

// シリアル通信の初期化
serial.redirect(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate9600)

// フォルダ1のトラック1を再生するコマンド
// 2~6を足し算して、補数を7,8に格納
// 足し算：https://www.ccn2.aitai.ne.jp/~keikun/16.html
// 補数：https://www.nin-fan.net/tool/complement.php
// 次の曲 
// let playFolderTrackCommand = [0x7E, 0xFF, 0x06, 0x01, 0x00, 0x00, 0x00, 0xFE, 0xFA, 0xEF];
// 前の曲
// let playFolderTrackCommand = [0x7E, 0xFF, 0x06, 0x02, 0x00, 0x00, 0x00, 0xFE, 0xF9, 0xEF];
// let waitCountlist = [0,0,0];

// 1曲目　Still Alive
let playMusic01 = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x01, 0x01, 0xFE, 0xEA, 0xEF];
// 2曲目 Coffe 
let playMusic02 = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x01, 0x02, 0xFE, 0xE9, 0xEF];
// 3曲目 SE
let playMusic03 = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x01, 0x03, 0xFE, 0xE8, 0xEF];
// 4曲目 to battle
let playMusic04 = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x01, 0x04, 0xFE, 0xE7, 0xEF];
// waitCountlist[2] = 250; //1分58秒
// 5曲目 the entertiner
let playMusic05 = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x01, 0x05, 0xFE, 0xE6, 0xEF];
// waitCountlist[0] = 250; //1分40秒
// 6曲目 ocian
let playMusic06 = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x01, 0x06, 0xFE, 0xE5, 0xEF];
// waitCountlist[1] = 250; //1分40秒


// おはようございます01
let playVoiceGoodMorning = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x02, 0x01, 0xFE, 0xE9, 0xEF];
// おつかれさまです02
let playVoiceThankyouHardWork = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x02, 0x02, 0xFE, 0xE8, 0xEF];
// こんにちは03
let playVoiceHello = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x02, 0x03, 0xFE, 0xE7, 0xEF];
// こんばんは04
let playVoiceGoodEvening = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x02, 0x04, 0xFE, 0xE6, 0xEF];
// ありがとうございます05
let playVoiceThankyou = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x02, 0x05, 0xFE, 0xE5, 0xEF];
// いらっしゃいませ06
let playVoiceWelcom = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x02, 0x06, 0xFE, 0xE4, 0xEF];
// 少々おまちください07
let playVoiceWaitPlease = [0x7E, 0xFF, 0x06, 0x0F, 0x00, 0x02, 0x07, 0xFE, 0xE3, 0xEF];

// DFPlayer Mini にコマンドを送信する関数
function sendDFPlayerCommand(command: number[]) {
    let buf = pins.createBuffer(command.length);
    for (let i = 0; i < command.length; i++) {
        buf[i] = command[i];
    }
    serial.writeBuffer(buf);
}

// ループ内で使う変数の初期値
let hours = 0;
let minutes = 0;
let seconds = 0;
let isPlaying = false;
let waitCount = 0;
let musicNumber = 0;
let time = readRTC();
let lightLevel = getLightLevel();

// Aを押したら時を1増やす
input.onButtonPressed(Button.A, function () {
    hours = (hours + 1) % 24;
    writeRTC(hours, minutes, seconds);
});

// Bボタンを押したら分を1増やす
input.onButtonPressed(Button.B, function () {
    minutes = (minutes + 1) % 60;
    writeRTC(hours, minutes, seconds);
});

// ABを押したら秒を0にする
input.onButtonPressed(Button.AB, function () {
    seconds = 0;
    writeRTC(hours, minutes, seconds);
});

basic.forever(function () {
    lightLevel = getLightLevel();
    time = readRTC();
    hours = time.hours;
    minutes = time.minutes;
    seconds = time.seconds;
    displayTime(hours, minutes, seconds);

    // 毎時00分00秒になったら時報を鳴らす
    if (seconds == 0 && minutes == 0 && lightLevel > 5) { // 明るさが5以上の場合
        isPlaying = true;
        waitCount = 250;
        if (musicNumber == 0){
            sendDFPlayerCommand(playMusic04);
        } else if (musicNumber == 1) {
            sendDFPlayerCommand(playMusic05);
        } else if (musicNumber == 2) {
            sendDFPlayerCommand(playMusic06);
        }
        musicNumber ++;
        if (musicNumber > 2) {
            musicNumber = 0;
        } 
    }

    // 人を感知したら挨拶をする
    if (!isPlaying) {
        if (pins.digitalReadPin(DigitalPin.P16) == 1) { // HC-SR501 が人を検知した場合
            if (hours >= 18 || hours < 4) {
                sendDFPlayerCommand(playVoiceGoodEvening);
            } else if (hours >= 10) {
                sendDFPlayerCommand(playVoiceHello);
            } else if (hours >= 4) {
                sendDFPlayerCommand(playVoiceGoodMorning);
            }
            isPlaying = true;
            waitCount = 150; // 1分2秒くらい
        }
    }

    // 音楽を再生中は他の音楽を再生しない
    if (isPlaying) {
        waitCount--; // 指定された時間待機するまで減らす。
        // 1秒5で　300で2分07  600で4分15秒くらい
        if (waitCount < 0) {
            waitCount = 0;
            isPlaying = false;
            // sendDFPlayerCommand(playMusic03);
        }
    }

    basic.pause(400); // 更新間隔を設定
});



