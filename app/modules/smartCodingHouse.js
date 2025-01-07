const BaseModule = require('./baseModule');

class SmartCodingHouse extends BaseModule {
    constructor() {
        super();
        
        // 아날로그 핀 매핑
        this.analogPin = {
            ULTRASONIC_TRIG: 0,
            ULTRASONIC_ECHO: 1,
            TEMP_HUM: 2,
            IR_SENSOR: 3,
            LIGHT_SENSOR: 4,
            RAIN_SENSOR: 5
        };

        // 디지털 핀 매핑
        this.digitalPin = {
            SERVO_MOTOR: 2,
            DC_MOTOR: 3,
            PUSH_BUTTON: 4,
            // 2층 테라스 LED
            TERRACE2_LED_BLUE: 5,
            TERRACE2_LED_GREEN: 12,
            TERRACE2_LED_RED: 13,
            // 1층 실외 LED
            OUTDOOR1_LED_GREEN: 6,
            OUTDOOR1_LED_RED: 7,
            OUTDOOR1_LED_BLUE: 8,
            // 1,2층 실내 LED
            INDOOR_LED_GREEN: 9,
            INDOOR_LED_RED: 10,
            INDOOR_LED_BLUE: 11
        };

        // 센서 값 저장
        this.sensorValue = {
            ultrasonic: 0,
            temperature: 0,
            humidity: 0,
            ir: 0,
            light: 0,
            rain: 0,
            button: 0
        };
    }

    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    requestLocalData() {
        const buffer = [];
        // 센서 데이터 요청 로직
        return buffer;
    }

    handleLocalData(data) {
        // 하드웨어에서 받은 데이터 처리
        if(data.length > 0) {
            this.sensorValue.ultrasonic = data[0];
            this.sensorValue.temperature = data[1];
            this.sensorValue.humidity = data[2];
            this.sensorValue.ir = data[3];
            this.sensorValue.light = data[4];
            this.sensorValue.rain = data[5];
            this.sensorValue.button = data[6];
        }
    }

    requestRemoteData(handler) {
        // 엔트리로 센서 데이터 전송
        handler.write('ultrasonic', this.sensorValue.ultrasonic);
        handler.write('temperature', this.sensorValue.temperature);
        handler.write('humidity', this.sensorValue.humidity);
        handler.write('ir', this.sensorValue.ir);
        handler.write('light', this.sensorValue.light);
        handler.write('rain', this.sensorValue.rain);
        handler.write('button', this.sensorValue.button);
    }

    handleRemoteData(handler) {
        // 엔트리에서 받은 명령 처리
        const received = handler.read('data');
        if(received) {
            // LED 제어
            if(received.led) {
                const { pin, value } = received.led;
                const buffer = Buffer.from([0x01, pin, value]);
                this.sp.write(buffer);
            }
            // 서보모터 제어
            if(received.servo !== undefined) {
                const buffer = Buffer.from([0x02, this.digitalPin.SERVO_MOTOR, received.servo]);
                this.sp.write(buffer);
            }
            // DC모터 제어
            if(received.dcMotor !== undefined) {
                const buffer = Buffer.from([0x03, this.digitalPin.DC_MOTOR, received.dcMotor]);
                this.sp.write(buffer);
            }
        }
    }



    // 연결 종료시 처리
    disconnect(connect) {
        const ledPins = [5,6,7,8,9,10,11,12,13];
        ledPins.forEach(pin => {
            const buffer = Buffer.from([0x01, pin, 0]);
            this.sp.write(buffer);
        });
        
        // 모터 정지
        this.sp.write(Buffer.from([0x03, this.digitalPin.DC_MOTOR, 0]));
        this.sp.write(Buffer.from([0x02, this.digitalPin.SERVO_MOTOR, 90]));
    }
}

module.exports = new SmartCodingHouse(); 