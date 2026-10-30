// Dictionary for word-to-number mapping to support spoken word inputs
const numberMap = {
  'zero': 0, 'one': 1, 'two': 2, 'to': 2, 'too': 2, 'three': 3, 'four': 4, 'for': 4,
  'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'ate': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
};

let runningTotal = 0;
let score = 0;
let currentRandomNumber = 0;
let isPlaying = false;
let recognition = null;

const numberDisplay = document.getElementById('number-display');
const targetDisplay = document.getElementById('target');
const scoreDisplay = document.getElementById('score');
const feedbackDisplay = document.getElementById('feedback');
const transcriptDisplay = document.getElementById('transcript');
const startBtn = document.getElementById('start-btn');

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
    if (event.error === 'no-speech') {
      feedbackDisplay.textContent = "Listening... Speak your answer!";
    }
  };

  recognition.onend = () => {
    // Keep recognition active while playing
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
  // Try matching numeric digits directly
  const directDigits = text.match(/\d+/);
  if (directDigits) {
    return parseInt(directDigits[0], 10);
  }

  // Try matching word equivalents
  const words = text.split(/\s+/);
  for (let word of words) {
    if (numberMap.hasOwnProperty(word)) {
      return numberMap[word];
    }
  }

  return null;
}

function nextTurn() {
  // Generate a new random number from 0 to 9
  currentRandomNumber = Math.floor(Math.random() * 10);
  runningTotal += currentRandomNumber;

  numberDisplay.textContent = currentRandomNumber;
  targetDisplay.textContent = runningTotal;
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
    scoreDisplay.textContent = score;
    feedbackDisplay.className = 'feedback correct';
    feedbackDisplay.textContent = "Correct! Loading next number...";

    setTimeout(() => {
      if (isPlaying) nextTurn();
    }, 1200);
  } else {
    feedbackDisplay.className = 'feedback wrong';
    feedbackDisplay.textContent = `Incorrect (${recognizedNum}). Total is ${runningTotal}. Try again!`;
  }
}

function startGame() {
  isPlaying = true;
  score = 0;
  runningTotal = 0;
  scoreDisplay.textContent = score;
  startBtn.textContent = "Stop Game";
  startBtn.classList.add('active');

  try {
    recognition.start();
  } catch (e) {
    console.log("Recognition already active.");
  }

  nextTurn();
}

function stopGame() {
  isPlaying = false;
  startBtn.textContent = "Start Game";
  startBtn.classList.remove('active');
  feedbackDisplay.className = 'feedback';
  feedbackDisplay.textContent = "Game Paused. Click Start to Play.";
  transcriptDisplay.textContent = 'Heard: "..."';

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
