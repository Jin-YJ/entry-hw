function Module() {
    this.sp = null;
    
    // 아날로그 핀 매핑
    this.analogPin = {
        ULTRASONIC_TRIG: 0,    // 초음파센서 Trigger
        ULTRASONIC_ECHO: 1,    // 초음파센서 Echo
        TEMP_HUM: 2,          // 온습도센서
        IR_SENSOR: 3,         // 적외선센서
        LIGHT_SENSOR: 4,      // 조도센서
        RAIN_SENSOR: 5        // 빗물감지센서
    };

    // 디지털 핀 매핑
    this.digitalPin = {
        SERVO_MOTOR: 2,       // 서보모터
        DC_MOTOR: 3,          // DC모터
        PUSH_BUTTON: 4,       // 푸시버튼

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

    // 센서 값 저장용 객체
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

// 모듈의 프로토타입 정의
Module.prototype = {
    // 초기화 함수
    init: function(handler, config) {
        this.handler = handler;
        this.config = config;
    },

    // LED 제어 함수
    setLED: function(pin, value) {
        var buffer = new Buffer([0x01, pin, value]);
        this.sp.write(buffer);
    },

    // 서보모터 제어 함수 (0-180도)
    setServo: function(angle) {
        var buffer = new Buffer([0x02, this.digitalPin.SERVO_MOTOR, angle]);
        this.sp.write(buffer);
    },

    // DC모터 제어 함수 (0-255)
    setDCMotor: function(speed) {
        var buffer = new Buffer([0x03, this.digitalPin.DC_MOTOR, speed]);
        this.sp.write(buffer);
    },

    // 초음파 센서 거리 읽기
    getUltrasonic: function() {
        return this.sensorValue.ultrasonic;
    },

    // 온습도 센서 읽기
    getTemperature: function() {
        return this.sensorValue.temperature;
    },
    
    getHumidity: function() {
        return this.sensorValue.humidity;
    },

    // 적외선 센서 읽기
    getIRSensor: function() {
        return this.sensorValue.ir;
    },

    // 조도 센서 읽기
    getLightSensor: function() {
        return this.sensorValue.light;
    },

    // 빗물 감지 센서 읽기
    getRainSensor: function() {
        return this.sensorValue.rain;
    },

    // 버튼 상태 읽기
    getButton: function() {
        return this.sensorValue.button;
    },

    // 데이터 처리 함수
    handleRemoteData: function(handler) {
        // 원격으로부터 데이터 수신 처리
        var received = handler.read('data');
        if(received) {
            // LED 제어
            if(received.led) {
                this.setLED(received.led.pin, received.led.value);
            }
            // 서보모터 제어
            if(received.servo !== undefined) {
                this.setServo(received.servo);
            }
            // DC모터 제어
            if(received.dcMotor !== undefined) {
                this.setDCMotor(received.dcMotor);
            }
        }
    },

    // 센서 데이터 전송 함수
    requestRemoteData: function(handler) {
        // 센서값들을 원격으로 전송
        handler.write('ultrasonic', this.sensorValue.ultrasonic);
        handler.write('temperature', this.sensorValue.temperature);
        handler.write('humidity', this.sensorValue.humidity);
        handler.write('ir', this.sensorValue.ir);
        handler.write('light', this.sensorValue.light);
        handler.write('rain', this.sensorValue.rain);
        handler.write('button', this.sensorValue.button);
    },

    // 하드웨어로부터 받은 데이터 처리
    handleLocalData: function(data) {
        // 수신된 데이터를 센서값으로 업데이트
        this.sensorValue.ultrasonic = data[0];
        this.sensorValue.temperature = data[1];
        this.sensorValue.humidity = data[2];
        this.sensorValue.ir = data[3];
        this.sensorValue.light = data[4];
        this.sensorValue.rain = data[5];
        this.sensorValue.button = data[6];
    },

    // 연결 해제시 처리
    disconnect: function(connect) {
        // 모든 LED 끄기
        const ledPins = [5,6,7,8,9,10,11,12,13];
        ledPins.forEach(pin => {
            this.setLED(pin, 0);
        });
        
        // 모터 정지
        this.setDCMotor(0);
        this.setServo(90); // 중립 위치로
    },

    // 리셋
    reset: function() {
        // 초기 상태로 리셋
        this.disconnect();
    }
};

module.exports = new Module(); 