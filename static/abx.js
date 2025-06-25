let audioContext;
let sourceA, sourceB;
let gainA, gainB, masterGain;
let started = false;
let currentX = null;
let currentTrack = null;
let decodedBufferA, decodedBufferB;

let trialNumber = 0;
let correctGuesses = 0;

async function loadAudio(url) {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

async function ensureStarted() {
  if (started) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.5;
  masterGain.connect(audioContext.destination);

  const bufferA = await loadAudio(AUDIO_PATH_A);
  const bufferB = await loadAudio(AUDIO_PATH_B);

  decodedBufferA = bufferA;
  decodedBufferB = bufferB;

  sourceA = audioContext.createBufferSource();
  sourceB = audioContext.createBufferSource();
  sourceA.buffer = decodedBufferA;
  sourceB.buffer = decodedBufferB;

  gainA = audioContext.createGain();
  gainB = audioContext.createGain();
  gainA.gain.value = 0;
  gainB.gain.value = 0;

  sourceA.connect(gainA).connect(masterGain);
  sourceB.connect(gainB).connect(masterGain);

  sourceA.start();
  sourceB.start();

  started = true;
  updateStatus("Status: Test in progress");
}

function updateStatus(text) {
  const status = document.getElementById("status");
  if (status) status.textContent = text;
}

function updatePauseLabel(fallback = "Pause") {
  const btn = document.getElementById("pause-button");
  if (!btn || !audioContext) return;

  if (audioContext.state === "suspended") {
    if (currentTrack === 'A') btn.textContent = "Resume A";
    else if (currentTrack === 'B') btn.textContent = "Resume B";
    else if (currentTrack === 'X') btn.textContent = `Resume X`;
  } else {
    btn.textContent = fallback;
  }
}

async function switchToA() {
  await ensureStarted();
  gainA.gain.setValueAtTime(1, audioContext.currentTime);
  gainB.gain.setValueAtTime(0, audioContext.currentTime);
  currentTrack = 'A';
  updateStatus("Status: Listening to A");
  updatePauseLabel();
}

async function switchToB() {
  await ensureStarted();
  gainA.gain.setValueAtTime(0, audioContext.currentTime);
  gainB.gain.setValueAtTime(1, audioContext.currentTime);
  currentTrack = 'B';
  updateStatus("Status: Listening to B");
  updatePauseLabel();
}

async function switchToX() {
  await ensureStarted();
  if (currentX === null) {
    currentX = Math.random() < 0.5 ? 'A' : 'B';
  }
  if (currentX === 'A') {
    await switchToA();
    updateStatus("Status: Listening to X (locked as A)");
  } else {
    await switchToB();
    updateStatus("Status: Listening to X (locked as B)");
  }
  currentTrack = 'X';
  updatePauseLabel();
}

function resetTrial() {
  if (!started || audioContext.state === "suspended") return;

  sourceA.stop();
  sourceB.stop();

  sourceA = audioContext.createBufferSource();
  sourceB = audioContext.createBufferSource();
  sourceA.buffer = decodedBufferA;
  sourceB.buffer = decodedBufferB;

  sourceA.connect(gainA).connect(masterGain);
  sourceB.connect(gainB).connect(masterGain);

  sourceA.start();
  sourceB.start();

  if (currentTrack === 'A') {
    gainA.gain.setValueAtTime(1, audioContext.currentTime);
    gainB.gain.setValueAtTime(0, audioContext.currentTime);
    updateStatus("Status: Restarted A");
  } else if (currentTrack === 'B') {
    gainA.gain.setValueAtTime(0, audioContext.currentTime);
    gainB.gain.setValueAtTime(1, audioContext.currentTime);
    updateStatus("Status: Restarted B");
  } else if (currentTrack === 'X') {
    if (currentX === 'A') {
      gainA.gain.setValueAtTime(1, audioContext.currentTime);
      gainB.gain.setValueAtTime(0, audioContext.currentTime);
      updateStatus("Status: Restarted X (locked as A)");
    } else if (currentX === 'B') {
      gainA.gain.setValueAtTime(0, audioContext.currentTime);
      gainB.gain.setValueAtTime(1, audioContext.currentTime);
      updateStatus("Status: Restarted X (locked as B)");
    }
  }
}

async function pauseAudio() {
  if (!started) return;

  const btn = document.getElementById("pause-button");

  if (audioContext.state === "running") {
    await audioContext.suspend();

    if (currentTrack === 'A') {
      updateStatus("Status: Paused on A");
      btn.textContent = "Resume A";
    } else if (currentTrack === 'B') {
      updateStatus("Status: Paused on B");
      btn.textContent = "Resume B";
    } else if (currentTrack === 'X') {
      updateStatus(`Status: Paused on X (was ${currentX})`);
      btn.textContent = "Resume X";
    }
  } else if (audioContext.state === "suspended") {
    await audioContext.resume();

    if (currentTrack === 'A') {
      updateStatus("Status: Listening to A");
    } else if (currentTrack === 'B') {
      updateStatus("Status: Listening to B");
    } else if (currentTrack === 'X') {
      updateStatus(`Status: Listening to X (locked as ${currentX})`);
    }

    btn.textContent = "Pause";
  }
}

function submitGuess(choice) {
  if (currentX === null) {
    alert("Please listen to X before guessing.");
    return;
  }

  trialNumber++;
  const correct = currentX === choice;
  if (correct) correctGuesses++;

  if (trialNumber >= TOTAL_TRIALS) {
    showResults();
  } else {
    updateStatus(`Trial ${trialNumber}/${TOTAL_TRIALS} complete. Click "Switch to X" to continue.`);
    currentX = null;
  }
}

function showResults() {
  const resultDiv = document.getElementById("result");
  const resultText = document.getElementById("result-text");

  resultText.textContent = `You got ${correctGuesses} out of ${TOTAL_TRIALS} correct.`;
  resultDiv.style.display = "block";

  // Hide ABX controls
  document.getElementById("guess-buttons").style.display = "none";
  updateStatus("Test complete.");
}

// Volume control
const volumeSlider = document.getElementById("volume");
const volumeLabel = document.getElementById("volume-label");
if (volumeSlider) {
  volumeSlider.addEventListener("input", () => {
    const value = volumeSlider.value;
    volumeLabel.textContent = `${value}%`;
    if (masterGain) {
      masterGain.gain.setValueAtTime(value / 100, audioContext.currentTime);
    }
  });
}
