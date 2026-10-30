const numberMap = {
  'zero': 0, 'one': 1, 'two': 2, 'to': 2, 'too': 2, 'three': 3, 'four': 4, 'for': 4,
  'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'ate': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
};

let runningTotal = 0;
let score = 0;
const targetScore = 10;
let isPlaying = false;
let currentGameMode = 'add'; 
let recognition = null;

// Timer variables
let startTime = 0;
let timerInterval = null;

const numberDisplay = document.getElementById('number-display');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const feedbackDisplay = document.getElementById('feedback');
const transcriptDisplay = document.getElementById('transcript');
const startBtn = document.getElementById('start-btn');
const modeButtons = document.querySelectorAll('.mode-btn');

// Initialize Web Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  feedbackDisplay.textContent = "Web Speech API not supported in this browser.";
  startBtn.disabled = true;
} else {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const lastResultIndex = event.results.length - 1;
    const spokenText = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
    transcriptDisplay.textContent = `Heard: "${spokenText}"`;
    processAnswer(spokenText);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (event.error === 'not-allowed') {
      feedbackDisplay.className = 'feedback wrong';
      feedbackDisplay.textContent = "Microphone access denied! Please allow mic permissions.";
    } else if (event.error === 'no-speech') {
      feedbackDisplay.textContent = "Listening... Speak your answer!";
    }
  };

  recognition.onend = () => {
    if (isPlaying) {
      try {
        recognition.start();
      } catch (e) {
        console.log("Restarting recognition...");
      }
    }
  };
}

function parseSpokenNumber(text) {
  const isNegative = text.includes('minus') || text.includes('negative');
  const directDigits = text.match(/-?\d+/);
  if (directDigits) {
    let num = parseInt(directDigits[0], 10);
    return isNegative && num > 0 ? -num : num;
  }

  const words = text.split(/\s+/);
  for (let word of words) {
    if (numberMap.hasOwnProperty(word)) {
      let val = numberMap[word];
      return isNegative ? -val : val;
    }
  }

  return null;
}

function startTimer() {
  startTime = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const seconds = String(elapsedSeconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function nextTurn() {
  const randomVal = Math.floor(Math.random() * 10);
  let isAddition = true;

  if (currentGameMode === 'add') {
    isAddition = true;
  } else if (currentGameMode === 'subtract') {
    isAddition = false;
  } else if (currentGameMode === 'mixed') {
    isAddition = Math.random() >= 0.5;
  }

  if (isAddition) {
    runningTotal += randomVal;
    numberDisplay.textContent = `+${randomVal}`;
  } else {
    runningTotal -= randomVal;
    numberDisplay.textContent = `-${randomVal}`;
  }

  feedbackDisplay.className = 'feedback listening';
  feedbackDisplay.textContent = "Listening for your answer...";
}

function processAnswer(spokenText) {
  const recognizedNum = parseSpokenNumber(spokenText);

  if (recognizedNum === null) {
    feedbackDisplay.className = 'feedback wrong';
    feedbackDisplay.textContent = "Didn't hear a clear number. Try again!";
    return;
  }

  if (recognizedNum === runningTotal) {
    score++;
    scoreDisplay.textContent = `${score} / ${targetScore}`;

    if (score >= targetScore) {
      stopTimer();
      isPlaying = false;
      if (recognition) recognition.stop();

      feedbackDisplay.className = 'feedback correct';
      feedbackDisplay.textContent = `🎉 Completed in ${timerDisplay.textContent}! Amazing human speed!`;
      startBtn.textContent = "Play Again";
      startBtn.classList.remove('active');
      numberDisplay.textContent = '🏆';
      return;
    }

    feedbackDisplay.className = 'feedback correct';
    feedbackDisplay.textContent = "Correct! Loading next number...";

    setTimeout(() => {
      if (isPlaying) nextTurn();
    }, 1000);
  } else {
    score = 0;
    scoreDisplay.textContent = `${score} / ${targetScore}`;
    feedbackDisplay.className = 'feedback wrong';
    feedbackDisplay.textContent = `Incorrect! Score reset. Say the total again.`;
  }
}

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (isPlaying) stopGame();

    modeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentGameMode = btn.dataset.mode;
  });
});

function startGame() {
  isPlaying = true;
  score = 0;
  runningTotal = 0;
  scoreDisplay.textContent = `${score} / ${targetScore}`;
  timerDisplay.textContent = "00:00";
  startBtn.textContent = "Stop Game";
  startBtn.classList.add('active');

  startTimer();

  try {
    recognition.start();
  } catch (e) {
    console.log("Recognition active.");
  }

  nextTurn();
}

function stopGame() {
  isPlaying = false;
  stopTimer();
  startBtn.textContent = "Start Game";
  startBtn.classList.remove('active');
  feedbackDisplay.className = 'feedback';
  feedbackDisplay.textContent = "Game Paused. Click Start to Play.";
  transcriptDisplay.textContent = 'Heard: "..."';
  numberDisplay.textContent = '?';

  if (recognition) {
    recognition.stop();
  }
}

startBtn.addEventListener('click', () => {
  if (isPlaying) {
    stopGame();
  } else {
    startGame();
  }
});
