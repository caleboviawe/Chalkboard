// --- Defining Classes ---
class User {
  constructor(name) {
    this.name = name;
    this.difficulty = difficulty;
    this.score = 0;
  }

  updateScore(isCorrect) {
    if (isCorrect) this.score++;
  }
}

class Question {
  constructor(category, question, correct_answer, incorrect_answers) {
    this.category = category;
    this.text = question;
    this.correct = correct_answer;
    this.options = [...incorrect_answers, correct_answer].sort(() => Math.random() - 0.5);
  }

  checkAnswer(answer) {
    return answer === this.correct;
  }
}

class Quiz {
  constructor(user) {
    this.user = user;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  async fetchQuestions() {
    const url = `https://opentdb.com/api.php?amount=15&difficulty=${this.user.difficulty}&type=multiple`;
    const response = await fetch(url);
    const data = await response.json();
    this.questions = data.results.map(
      q => new Question(q.category, q.question, q.correct_answer, q.incorrect_answers)
    );
  }

  // Generator for managing question flow
  *questionGenerator() {
    for (let i = 0; i < this.questions.length; i++) {
      yield this.questions[i];
    }
  }

  nextQuestion() {
    const next = this.generator.next();
    return next.done ? null : next.value;
  }

  start() {
    this.generator = this.questionGenerator();
  }
}

// Grab chalkboard div
const chalkboard = document.getElementById('chalkboard');

// Store current user info globally for now
let currentUser = null;

// --- Initial Homepage ---
function renderHomePage() {
  chalkboard.innerHTML = `
    <h1 class="welcome-title" style="color:#fffa65">Welcome to ChalkBoard!</h1>
    <h2 class="welcome-subtitle">Test your knowledge on various topics ranging from Math and Geography, to Sports and Pop Culture.</h2>
    <p class="welcome-subtitle">Please enter your name and select a difficulty:</p>
    
    <input type="text" id="username" class="welcome-input-field" placeholder="Enter your name" />
    
    <select id="difficulty" class="welcome-input-field">
      <option value="" disabled selected>Select difficulty</option>
      <option value="easy">Easy</option>
      <option value="medium">Medium</option>
      <option value="hard">Hard</option>
    </select>
    
    <button id="startBtn" class="btn">Start Quiz</button>
  `;

  // Add event listener for the start button
  document.getElementById('startBtn').addEventListener('click', () => {
    const name = document.getElementById('username').value.trim();
    const difficulty = document.getElementById('difficulty').value;

    if (!name || !difficulty) {
      alert("Please enter your name and select a difficulty!");
      return;
    }

    // Save user info
    currentUser = new User(name);
    currentUser.difficulty = difficulty;

    // For checking that the input is saved
    console.log("User info saved:", currentUser);

    // Move to next quiz state
    renderQuizPage()
  });
}

// --- Quiz Page ---
async function renderQuizPage() {
  try {
    // Clear the chalkboard
    chalkboard.innerHTML = `
      <div class="quiz-header">
        <div class="left-section">
            <p>User: <span id="displayUsername">${currentUser.name}</span></p>
            <p>Score: <span id="displayScore">${currentUser.score}</span></p>
        </div>
        <div class="right-section">
            <p>Difficulty:
            <span id="displayDifficulty">${currentUser.difficulty}</span>
            </p>
            <p>Update:
            <select id="changeDifficulty" class="difficulty-select">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
            </select>
            </p>
        </div>
      </div>

      <div class="quiz-body">
        <h3 class="category">The Category is <span id="questionCategory">Loading...</span></h3>
        <p id="questionText" style="font-size:20px">Fetching question...</p>
        <div id="choicesContainer" class="choices"></div>
      </div>

      <div class="quiz-footer">
        <button id="submitBtn" class="btn">Submit Answer</button>
        <button id="nextBtn" class="btn">Next Question</button>
      </div>
    `;

    // Instantiate quiz
    currentQuiz = new Quiz(currentUser);
    await currentQuiz.fetchQuestions(); // async fetch
    currentQuiz.start();
    currentQuestion = currentQuiz.nextQuestion();

    // Display first question
    renderQuestion(currentQuestion);

    // Handle difficulty change dynamically
    document.getElementById("changeDifficulty").addEventListener("change", async (e) => {
      const newDiff = e.target.value;
      currentUser.difficulty = newDiff;
      document.getElementById("displayDifficulty").textContent = newDiff;
      await handleDifficultyChange.call(currentQuiz, newDiff); // using call()
    });

    // Set up button actions
    document.getElementById("submitBtn").addEventListener("click", handleSubmit.bind(currentQuiz));
    document.getElementById("nextBtn").addEventListener("click", handleNextQuestion.bind(currentQuiz));

  } catch (error) {
    console.error("Error initializing quiz:", error);
    chalkboard.innerHTML = `<p style="color: red;">Failed to load quiz. Please try again later.</p>`;
  }
}


// --- Helper Functions ---
function renderQuestion(question) {
  if (!question) {
    chalkboard.innerHTML = `<h2 style="text-align:center">Quiz Complete! Thanks for playing!</h2>
      <p>Your final score: ${currentUser.score}</p>
      <button class="btn" onclick="renderHomePage()">Play Again</button>`;
    return;
  }

  document.getElementById("questionCategory").textContent = question.category;
  document.getElementById("questionText").innerHTML = question.text;

  const container = document.getElementById("choicesContainer");
  container.innerHTML = "";

  question.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className = "btn choice-btn";
    btn.addEventListener("click", () => selectAnswer.apply(question, [option])); // using apply()
    container.appendChild(btn);
  });
}

function selectAnswer(selectedOption) {
  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach(btn => btn.classList.remove("selected"));
  const selectedBtn = Array.from(buttons).find(b => b.textContent === selectedOption);
  if (selectedBtn) selectedBtn.classList.add("selected");
}

function handleSubmit() {
  const selectedBtn = document.querySelector(".choice-btn.selected");
  if (!selectedBtn) {
    alert("Please select an answer before submitting!");
    return;
  }

  const userAnswer = selectedBtn.textContent;
  const isCorrect = currentQuestion.checkAnswer(userAnswer);
  currentUser.updateScore(isCorrect);

  document.getElementById("displayScore").textContent = currentUser.score;

  selectedBtn.style.backgroundColor = isCorrect ? "#44ea44" : "red";

  if (!isCorrect) {
    const correctBtn = Array.from(document.querySelectorAll(".choice-btn"))
      .find(btn => btn.textContent === currentQuestion.correct);
    if (correctBtn) correctBtn.style.backgroundColor = "#44ea44";
  }
}

function handleNextQuestion() {
  currentQuestion = currentQuiz.nextQuestion();
  renderQuestion(currentQuestion);
}

async function handleDifficultyChange(newDifficulty) {
  try {
    this.user.difficulty = newDifficulty;
    await this.fetchQuestions();
    this.start();
    currentQuestion = this.nextQuestion();
    renderQuestion(currentQuestion);
  } catch (error) {
    console.error("Error changing difficulty:", error);
    alert("Failed to fetch new questions. Try again later.");
  }
}

// --- Initialize app ---
renderHomePage();
