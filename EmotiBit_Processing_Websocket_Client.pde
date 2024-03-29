import websockets.*;

//EmotiBit Processing Oscilliscope thru Websocket
//This uses the EmotiBit_OSC_Viz_Example.pde code with added implementation for Websocket
import oscP5.*;
import netP5.*;
import processing.data.JSONObject;

// ------------ CHANGE PARAMETERS HERE --------------- //
// Look in EmotiBit Oscilloscope/data/oscOutputSettings.xml for EmotiBit OSC port and addresses
String oscAddress = "/EmotiBit/0/HEART"; 
int oscPort = 12345;

// Change these variables to change the filters
float samplingFreq = 25; // change to match sampling frequency of the data but this is hardcoded from the documentation
boolean lowPass = true; // toggles on/off the low-pass filter
float lpCut = 3; // adjusts the cut frequency of the low-pass filter
boolean highPass = true; // toggles on/off the high-pass filter
float hpCut = 1; // adjusts the cut frequency of the high-pass filter

// See additional info here: 
// https://github.com/EmotiBit/EmotiBit_Docs/blob/master/Working_with_emotibit_data.md
// https://www.emotibit.com/
// --------------------------------------------------- //

OscP5 oscP5;
FloatList dataList = new FloatList();

// filter variables
float lpFiltVal;
float hpFiltVal;
boolean firstFilt = true;

//WEBSOCKET IMPLEMENTATION (EMOTIFIT GROUP)
WebsocketClient wsc;
//String SERVER_URL = "wss://127.0.0.1";

void setup() {
  size(1400, 240);
  
  oscP5 = new OscP5(this, oscPort);
  
  //WEBSOCKET IMPLEMENTATION
  //StringList headers = new StringList();
  //headers.append("User-Agent:Processing");
  //wsc = new WebsocketClient(this, SERVER_URL, headers);
  
}

void draw() {
  
    if (dataList.size() > 0)
  {    
    // Create a data vizualization
    float data = dataList.get(dataList.size() - 1); // get the most recent data point
    int alpha = int(255 * autoscale(data)); // autoscale data
    println("data: " + alpha + ", " + data); // print alpha in the console
    background(alpha, 0, 0); // change the background using alpha
    
      if (data >= 90) {
      // Increase low-pass cutoff frequency
      lpCut = 5;
      // Decrease high-pass cutoff frequency
      hpCut = 0.5;
    } else {
      // Reset filter cutoff frequencies to initial values
      lpCut = 3;
      hpCut = 1;
    }

    drawData();
  }
  
}

// --------------------------------------------------- //
// Draw the data like an oscilloscope display
void drawData() {

  stroke(255);
    
  while (dataList.size() > width) {
    dataList.remove(0); // Remove oldest item in list if larger than window
  }
  
  // Plot the data autoscaled to the height
  for (int n = 0; n < dataList.size() - 1; n++) {
    float xScale = 12.0; // Adjust this scale factor as needed
    
    float x1 = n * xScale;
    float x2 = (n + 1) * xScale;
    float y1 = height * autoscale(dataList.get(n));
    float y2 = height * autoscale(dataList.get(n + 1));
    line(x1, height - y1, x2, height - y2);
 
  }
  
  //sendJSONData();
}

// --------------------------------------------------- //
// Outputs data value normalized to 0.0 to 1.0
float autoscale(float data) {
  if (dataList.size() > 0) {
    float minData = dataList.min(); 
    float maxData = dataList.max();
    return (data - minData) / (maxData - minData); // autoscale the data
  }
  else {
    return 0;
  }
}

// --------------------------------------------------- //
// Process incoming OSC message
void oscEvent(OscMessage theOscMessage) {
  //println("### received an osc message. with address pattern "+theOscMessage.addrPattern());
  if (theOscMessage.checkAddrPattern(oscAddress)) {
    Object[] args = theOscMessage.arguments();
    for (int n = 0; n < args.length; n++)
    {
      float data = theOscMessage.get(n).floatValue();
      
      // Filter data to extract features
      data = filter(data);
      
      dataList.append(data); // store data for plotting and autoscaling
    }
  }
}
  
// --------------------------------------------------- //
// Function to do some basic filtering of the data
// Change global filter variables at top of file
float filter(float data) {

  float DIGITAL_FILTER_PI = 3.1415926535897932384626433832795;
  float DIGITAL_FILTER_E = 2.7182818284590452353602874713526;
  float lpAlpha = pow(DIGITAL_FILTER_E, -2.f * DIGITAL_FILTER_PI * lpCut / samplingFreq);
  float hpAlpha = pow(DIGITAL_FILTER_E, -2.f * DIGITAL_FILTER_PI * hpCut / samplingFreq);
  if (lowPass) {
    if (firstFilt) {
      lpFiltVal = data;
    } else {
      lpFiltVal = data * (1. - lpAlpha) + lpFiltVal * lpAlpha;
    }
    //println("filter LP: " + data + ", " + lpFiltVal + ", " + lpAlpha);
    data = lpFiltVal;
  }
  if (highPass) {
    if (firstFilt) {
      hpFiltVal = data;
    } else {
      hpFiltVal = data * (1. - hpAlpha) + hpFiltVal * hpAlpha;
    }
    //println("filter HP: " + data + ", " + hpFiltVal + ", " + hpAlpha);
    data = data - hpFiltVal;
  }
  firstFilt = false;
  return data;
}
 
// SENDING DATA TO SERVER (EMOTIFIT GROUP)
/*void sendJSONData() {
  if (dataList.size() > 0) {
    
    float data = dataList.get(dataList.size() - 1);
    
    JSONObject json = new JSONObject();
    json.setFloat("data", data);
    
    String jsonString = json.toString();
    
    wsc.sendMessage(jsonString);
    
    println("Sent JSON data: " + jsonString);
  }
}*/
