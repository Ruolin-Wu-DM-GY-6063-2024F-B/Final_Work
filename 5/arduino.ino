const int forcePin = 13;  
const int potPin = 11;    
const int ledPin = 9;    

unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(9600);
  pinMode(forcePin, INPUT);
  pinMode(potPin, INPUT);
  pinMode(ledPin, OUTPUT);
  analogWrite(ledPin, 0);
}

void loop() {
 
  if (millis() - lastSendTime > 100) {
    int forceVal = analogRead(forcePin);
    int potVal = analogRead(potPin);
    StaticJsonDocument<128> doc;
    doc["forceVal"] = forceVal;
    doc["potVal"] = potVal;

    serializeJson(doc, Serial);
    Serial.println();
    lastSendTime = millis();
  }

  if (Serial.available() > 0) {
    String jsonText = Serial.readStringUntil('\n');
    if (jsonText.length() > 0) {
      StaticJsonDocument<128> resJson;
      DeserializationError error = deserializeJson(resJson, jsonText);
      if (!error) {
   
        if (resJson.containsKey("led")) {
          int ledVal = resJson["led"];
          analogWrite(ledPin, constrain(ledVal,0,255));
        }
      }
    }
  }
}
