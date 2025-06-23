let audioContext;
let sourceA, sourceB;
let gainA, gainB, masterGain;
let started = false;
let isPaused = false;
let currentX = null;
let currentTrack = null;
let decodedBufferA, decodedBufferB;

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
    sourceA.buffer = bufferA;
    sourceB.buffer = bufferB;

    gainA = audioContext.createGain();
    gainB = audioContext.createGain();

    gainA.gain.value = 0;
    gainB.gain.value = 0;

    sourceA.connect(gainA).connect(masterGain);
    sourceB.connect(gainB).connect(masterGain);

    sourceA.start();
    sourceB.start();

    started = true;
    document.getElementById("status").textContent = "Status: Test in progress";
}

async function switchToA() {
    await ensureStarted();
    gainA.gain.setValueAtTime(1, audioContext.currentTime);
    gainB.gain.setValueAtTime(0, audioContext.currentTime);
    currentTrack = 'A';
    isPaused = false;
    document.getElementById("status").textContent = "Status: Listening to A";
    updatePauseLabel();
}

async function switchToB() {
    await ensureStarted();
    gainA.gain.setValueAtTime(0, audioContext.currentTime);
    gainB.gain.setValueAtTime(1, audioContext.currentTime);
    currentTrack = 'B';
    isPaused = false;
    document.getElementById("status").textContent = "Status: Listening to B";
    updatePauseLabel();
}

async function switchToX() {
    await ensureStarted();
    if (currentX === null) {
        currentX = Math.random() < 0.5 ? 'A' : 'B';
    }
    if (currentX === 'A') {
        await switchToA();
        document.getElementById("status").textContent = "Status: Listening to X (locked as A)";
    } else {
        await switchToB();
        document.getElementById("status").textContent = "Status: Listening to X (locked as B)";
    }
    currentTrack = 'X';
    isPaused = false;
    updatePauseLabel();
}

function resetTrial() {
    if (!started || audioContext.state === "suspended") return;

    if (currentTrack === 'A') {
        sourceA.stop();
        sourceA = audioContext.createBufferSource();
        sourceA.buffer = decodedBufferA;
        sourceA.connect(gainA).connect(masterGain);
        gainA.gain.setValueAtTime(1, audioContext.currentTime);
        sourceA.start();
        document.getElementById("status").textContent = "Status: Restarted A";
    } else if (currentTrack === 'B') {
        sourceB.stop();
        sourceB = audioContext.createBufferSource();
        sourceB.buffer = decodedBufferB;
        sourceB.connect(gainB).connect(masterGain);
        gainB.gain.setValueAtTime(1, audioContext.currentTime);
        sourceB.start();
        document.getElementById("status").textContent = "Status: Restarted B";
    } else if (currentTrack === 'X') {
        if (currentX === 'A') {
            sourceA.stop();
            sourceA = audioContext.createBufferSource();
            sourceA.buffer = decodedBufferA;
            sourceA.connect(gainA).connect(masterGain);
            gainA.gain.setValueAtTime(1, audioContext.currentTime);
            sourceA.start();
            document.getElementById("status").textContent = `Status: Restarted X (locked as A)`;
        } else if (currentX === 'B') {
            sourceB.stop();
            sourceB = audioContext.createBufferSource();
            sourceB.buffer = decodedBufferB;
            sourceB.connect(gainB).connect(masterGain);
            gainB.gain.setValueAtTime(1, audioContext.currentTime);
            sourceB.start();
            document.getElementById("status").textContent = `Status: Restarted X (locked as B)`;
        }
    }
}

async function pauseAudio() {
    if (!started) return;
    const btn = document.getElementById("pause-button");

    if (audioContext.state === "running") {
        await audioContext.suspend();
        isPaused = true;

        if (currentTrack === 'A') {
            document.getElementById("status").textContent = "Status: Paused on A";
            updatePauseLabel("Resume A");
        } else if (currentTrack === 'B') {
            document.getElementById("status").textContent = "Status: Paused on B";
            updatePauseLabel("Resume B");
        } else if (currentTrack === 'X') {
            document.getElementById("status").textContent = `Status: Paused on X (was ${currentX})`;
            updatePauseLabel(`Resume X`);
        }
    } else if (audioContext.state === "suspended") {
        await audioContext.resume();
        isPaused = false;

        if (currentTrack === 'A') {
            document.getElementById("status").textContent = "Status: Listening to A";
        } else if (currentTrack === 'B') {
            document.getElementById("status").textContent = "Status: Listening to B";
        } else if (currentTrack === 'X') {
            document.getElementById("status").textContent = `Status: Listening to X (locked as ${currentX})`;
        }

        updatePauseLabel("Pause");
    }
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

const volumeSlider = document.getElementById("volume");
const volumeLabel = document.getElementById("volume-label");
volumeSlider.addEventListener("input", () => {
    const value = volumeSlider.value;
    volumeLabel.textContent = `${value}%`;
    if (masterGain) {
        masterGain.gain.setValueAtTime(value / 100, audioContext.currentTime);
    }
});
