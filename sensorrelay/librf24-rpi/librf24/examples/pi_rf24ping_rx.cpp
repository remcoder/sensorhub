#include <cstdlib>
#include <iostream>
#include "../RF24.h"
#include <math.h> 

using namespace std;

// use platform independent type to make sure both parties agree
int16_t packet[5];
int PACKET_SIZE = sizeof packet;

// spi device, spi speed, ce gpio pin
RF24 radio("/dev/spidev0.0",8000000,25);
 
void readPacket() {
    // dump the payloads until we've got everything
    bool done = false;
    while (!done)
    {
        // fetch the payload, and see if this was the last one
        done = radio.read(&packet, PACKET_SIZE);
    }
    cout << "packet received" << endl;

    int16_t senderId = packet[0];
    int16_t packet_count = packet[1];
    // TODO: int uptime = packet[2];
    float temp = ((float)packet[3]) / 100.0;
    float hum = ((float)packet[4]) / 100.0;
    cout << "[" << senderId << "] PacketCount = " << packet_count << endl;
    cout << "[" << senderId << "] Humidity = " << hum << endl;
    cout << "[" << senderId << "] Temperature = " << temp << endl;
    cout << endl;
}

void setup(void)
{
    cout << "# packet size: " << PACKET_SIZE; 

    // init radio for reading
    radio.begin();
    radio.setAutoAck(1);
    radio.setRetries(15,15);
    radio.setDataRate(RF24_250KBPS);
    
    radio.setChannel(0x4c);
    radio.setCRCLength(RF24_CRC_16);
    radio.openReadingPipe(1,0xF0F0F0F0E1LL);
    radio.startListening();

    radio.printDetails();
}
 
void loop(void)
{
    if (radio.available())
        readPacket();
}
 
int main(int argc, char** argv) 
{
    setup();
    while(1)
        loop();
 
    return 0;
}
