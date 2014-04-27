#include <EEPROM.h>

// RF24 library to use nRF24L01+
// https://github.com/maniacbug/RF24
#include <SPI.h>
#include "nRF24L01.h"
#include <RF24.h>
#include "printf.h"

// Adafruit DTHx sensor libary 
// https://github.com/adafruit/DHT-sensor-library
#include "DHT.h"

#define DHTTYPE DHT22   // DHT version 
#define DHTPIN 2        // DHT datapin
#define endl "\n"

// enabling << operator for printing to a Stream
// http://playground.arduino.cc/Main/StreamingOutput
template<class T> inline Print &operator <<(Print &obj, T arg) { obj.print(arg); return obj; }

// init sensor
DHT dht(DHTPIN, DHTTYPE);

// ce,csn pins
RF24 radio(9,10);
 
int sensor_id;
int16_t packet[5]; // platform independent type to make sure both parties agree
int PACKET_SIZE = sizeof packet;
int packet_count = 0;

void setup(void)
{
  randomSeed(analogRead(0));
  
  Serial.begin(9600);
  Serial << "\n" << "SensorNodeRF24" << endl << "--------------" << endl;
  
  // read sensor id from eeprom address 0x00;
  sensor_id = EEPROM.read(0x00);
  Serial << "sensor_id from EEPROM = " << formatHex(sensor_id) << "\n\n";
  
  pinMode(3, OUTPUT);
  digitalWrite(3, HIGH);
  
  Serial << "starting RF24 module" << "\n";
  printf_begin();
  radio.begin();
  radio.setDataRate(RF24_250KBPS);
  radio.setPALevel(RF24_PA_MAX);
  radio.setRetries(15,15);
  radio.setChannel(0x4c);
  radio.setAutoAck(true);
  
  // open pipe for writing
  radio.openWritingPipe(0xF0F0F0F0E1LL);
  radio.powerUp();  
  radio.printDetails();
  
  Serial << "\n" << "Startup took " << millis() << "ms" << endl;
  Serial << "Now entering main loop.." << endl << endl;
}
 
void loop(void)
{
   measure();
   
   int d = random(5000, 15000);
   Serial << "waiting " << d << "ms\n\n";
   delay(d); // randomize delay to ensure we don't get stuck in an enless streak of collisions
}

void measure() {
  Serial << "measuring temperature: ";
  
  int temp = round(dht.readTemperature()*100.0);
  Serial << temp << "C" << endl;
  Serial << "measuring humidity: ";
  digitalWrite(3, HIGH);
  int hum = round(dht.readHumidity()*100.0);
  Serial << hum << "%" << endl;
  
  digitalWrite(3, HIGH);
  sendPacket(temp, hum);
  
  digitalWrite(3, LOW);
  delay(1000);

}

void sendPacket(int temp, int hum) {
  Serial << "sending packet" << endl;
  packet[0] = (int16_t) sensor_id;
  packet[1] = (int16_t) packet_count;  
  packet[2] = 0; // TODO uptime
  packet[3] = (int16_t) temp;
  packet[4] = (int16_t) hum;
  
  radio.write(&packet, PACKET_SIZE);  
  packet_count++;
}

String formatHex(char x) {
  String s = "0x";
   
  if (x < 16)
    s += "0";

  s += String(x, HEX);
  return s;
}
