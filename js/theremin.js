// Data
var noteNames = ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6'];
var noteFreq =  [130 , 146, 164, 174, 196, 220, 246,261 ,293 ,329 ,349 ,392 ,440 ,493 ,523 ,587 ,659 ,698, 783 ,880, 987 ,1046];

function initialize() {
  // Write note data to screen
  if(noteNames.length === noteFreq.length) { // Array lengths should match
    for(var i = 0; i < noteFreq.length; i++) {
      // Convert to %
      y_coordinate = 100*(1-((noteFreq[i] - noteFreq[0])/(noteFreq[noteFreq.length-1] - noteFreq[0])));

      // Generate the note label
      var div = document.createElement("div");
      div.setAttribute('class', 'floating');
      div.style.top = String(y_coordinate) + "%";
      div.textContent = noteNames[i];
      document.body.appendChild(div);

      // Generate the lines
      var hr = document.createElement("hr");
      hr.setAttribute('class', 'line');
      hr.style.top = String(y_coordinate) + "%";
      document.body.appendChild(hr);

      // Move the div based on frequency and volume
      const dot1 = document.getElementById("controller_one");
      const dot2 = document.getElementById("controller_two");

      // Hide the controller divs initially
      dot1.style.visibility = "hidden";
      dot2.style.visibility = "hidden";

      // On Safari, it appears you can begin outputting from Audio Context without needing permission/gesture.
      // On Chrome, you have to tell the audio context that you wish to start/resume.
      // This sets the initial state of the audio toggle box for Hand 1 / Hand 2.
      document.getElementById("audio1Toggle").checked = audioContextEnabled(0);
      document.getElementById("audio2Toggle").checked = audioContextEnabled(1);
    }
  }
}

// Declare variables
var sampleRate = 44100;
var frequency = 440;
var audioCtx = [];
var oscillator = [];
var gainNode = [];

const AudioContext = window.AudioContext || window.webkitAudioContext;

for(var i = 0; i < 4; i++) {
  audioCtx[i] = new AudioContext();

  // Audio Variables
  oscillator[i] = audioCtx[i].createOscillator();
  gainNode[i] = audioCtx[i].createGain();
  oscillator[i].frequency.value = 0;
  if (i===0) {
      oscillator[i].type = 'sine'; // Sine wave
  }
  else {
    oscillator[i].type = 'sine'; // Sine wave
  }

  oscillator[i].connect(gainNode[i]);
  gainNode[i].connect(audioCtx[i].destination);
  gainNode[i].gain.value = 0.5;

  if (oscillator[i].start) {
      oscillator[i].start(0);
  }
}

function audioContextEnabled(index) {
  return audioCtx[index].state === 'running';
}

function toggleAudioContext(index) {
    if (index > audioCtx.length-1) {
      console.warning("AudioContext index out of range.");
      return;
    }

    if (audioCtx[index].state !== 'running') {
      audioCtx[index].resume();
    }
    else {
      audioCtx[index].suspend();
    }
}

// Leap motion loop
Leap.loop(function(frame) {
  // Check if any hands are present
  var dot1 = document.getElementById("controller_one");
  var dot2 = document.getElementById("controller_two");
  var freq1Text = document.getElementById("frequency_one");
  var freq2Text = document.getElementById("frequency_two");
  var vol1Text = document.getElementById("volume_one");
  var vol2Text = document.getElementById("volume_two");

  if(frame.hands.length < 1) {
    gainNode[0].gain.value = 0;
    gainNode[1].gain.value = 0;
    freq1Text.textContent = "0";
    vol1Text.textContent = "0";
    freq2Text.textContent = "0";
    vol2Text.textContent = "0";

    // Move the div based on frequency and volume
    dot1.style.visibility = "hidden";
    dot2.style.visibility = "hidden";
    return;
  }

  // TODO: check if hands entered, no audioContexts resumed, warn user.

  // Declare variables
  var xPos = []; // Currently for visual x-pos only.
  var freq = [];
  var vol = [];
  var hand = [];
  var x = [];
  var y = [];
  var z = [];

  // Get xyz positions of the palm(s); only x and y are used.
  for(var i = 0; i < frame.hands.length; i++) {
    hand[i] = frame.hands[i];

    x[i] = hand[i].stabilizedPalmPosition[0];
    y[i] = hand[i].stabilizedPalmPosition[1];
    z[i] = hand[i].palmPosition[2];
  }

  // In this implementation, we modify the sinewave using the following Leap coordinates:
  // Frequency is hand pos Y (top-bottom)
  // Amplitude is hand pos Z (forward-back)
  xPos[0] = Math.abs(2 - x[0]*0.01); // Unused, currently - could hook up to effect/filter?
  freq[0] = Math.abs(y[0]*4 - 150);
  vol[0] = Math.min(Math.max((2 - z[0]*0.01), 0), 2);;
  if(frame.hands.length === 1) {
    freq[1] = 0;
    vol[1] = 0;
  } else {
    xPos[1] = Math.abs(2 - x[1]*0.01);
    freq[1] = Math.abs(y[1]*4 - 150);
    vol[1] = Math.min(Math.max((2 - z[1]*0.01), 0), 2);;
  }

  // Output the sound to the oscillator and gainnode
  oscillator[0].frequency.value = freq[0];
  gainNode[0].gain.value = vol[0];

  // Update HTML elements w/ frequency/gain data
  freq1Text.textContent = String(Math.floor(freq[0]));
  vol1Text.textContent = String(gainNode[0].gain.value.toFixed(2));

  dot1.style.visibility = "visible";
  dot1.style.top = String(100*(1-((freq[0] - noteFreq[0])/(noteFreq[noteFreq.length-1] - noteFreq[0])))) + "%";
  dot1.style.left = String(100 - xPos[0]*25) + "%";
  dot1.style.transform = `scale(${4*gainNode[0].gain.value},${4*gainNode[0].gain.value})`;

  if(frame.hands.length === 2) {
    dot2.style.visibility = "visible";
    oscillator[1].frequency.value = freq[1];
    gainNode[1].gain.value = vol[1];
    freq2Text.textContent = String(Math.floor(freq[1]));
    vol2Text.textContent = String(vol[1].toFixed(2));
    dot2.style.top = String(100*(1-((freq[1] - noteFreq[0])/(noteFreq[noteFreq.length-1] - noteFreq[0])))) + "%";
    dot2.style.left = String(100 - xPos[1]*25) + "%";
    dot2.style.transform = `scale(${4*gainNode[1].gain.value},${4*gainNode[1].gain.value})`;
  } else {
    dot2.style.visibility = "hidden";
  }
});
