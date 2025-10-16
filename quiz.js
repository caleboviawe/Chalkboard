// --- Defining Classes ---
class User {
  constructor(name) {
    this.name = name;
    this.difficulty = difficulty;
    this.score = 0;
    this.scoreHistory = [];
  }

  updateScore(isCorrect, userAnswer, questionCategory, questionText, questionDifficulty) {
    if (isCorrect) this.score++;
    this.scoreHistory.push({
      category: questionCategory,
      difficulty: questionDifficulty,  
      question: questionText,
      answer: userAnswer,
      result: isCorrect ? "✅ Correct" : "❌ Incorrect",
    });
  }
}

class Question {
  constructor(difficulty, category, question, correct_answer, incorrect_answers) {
    this.difficulty = difficulty;
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
    const url = `https://opentdb.com/api.php?amount=10&difficulty=${this.user.difficulty}`;
    const response = await fetch(url);
    const data = await response.json();
    this.questions = data.results.map(
      q => new Question(q.difficulty, q.category, q.question, q.correct_answer, q.incorrect_answers)
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

// --- Global Variables ---
// Grab chalkboard div
const chalkboard = document.getElementById('chalkboard');

// Store current user info globally for now
let currentUser = null;

// Keep track of the answer streaks
let correctStreak = 0;
let incorrectStreak = 0;

// --- Initial Homepage ---
function renderHomePage() {
  // Update the chalkboard display  
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

    // Move to quiz state
    renderQuizPage()
  });
}

// --- Quiz Page ---
async function renderQuizPage() {
  try {
    // Update the chalkboard display
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
                <option value="" disabled selected>Select difficulty</option>
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

    // Display the question
    renderQuestion(currentQuestion);

    // Handle manual difficulty change from the user
    document.getElementById("changeDifficulty").addEventListener("change", async (e) => { 
      const newDiff = e.target.value;
      currentUser.difficulty = newDiff;
      correctStreak = 0;
      incorrectStreak = 0;
      document.getElementById("displayDifficulty").textContent = newDiff;
      await handleDifficultyChange.call(currentQuiz, newDiff); // using call()
    });

    // Set up button actions
    document.getElementById("submitBtn").addEventListener("click", handleSubmit.bind(currentQuiz)); // using bind()
    document.getElementById("nextBtn").addEventListener("click", handleNextQuestion.bind(currentQuiz)); // using bind()

  } catch (error) {
    console.error("Error initializing quiz:", error);
    chalkboard.innerHTML = `<p style="color: red;">Failed to load quiz. Please try again later.</p>`;
  }
}

// -- End Page ---
function renderEndPage() {
  // Update the chalkboard display  
  chalkboard.innerHTML = `
    <div class="end-screen">
      <h1 style="text-align:center">Quiz complete! Thanks for playing!</h1>
      <h2>Your final score: ${currentUser.score}</h2>
      <table class="score-table">
        <thead>
        <tr>
            <th>Category</th>
            <th>Difficulty</th>
            <th>Question</th>
            <th>Your Answer</th>
            <th>Result</th>
        </tr>
        </thead>
      <tbody id="scoreHistoryBody"></tbody>
     </table>
      <button class="btn" onclick="renderHomePage()">Play Again</button>
    </div>
  `;

  // Constructing the score history table
  const historyBody = document.getElementById("scoreHistoryBody");
  currentUser.scoreHistory.forEach(entry => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.category}</td> 
      <td>${entry.difficulty}</td> 
      <td>${entry.question}</td>
      <td>${entry.answer}</td>
      <td>${entry.result}</td>
    `;
    historyBody.appendChild(row);
  });
}

// -- Helper Functions
function renderQuestion(question) {
  // Load the end page if there isn't a question to display  
  if (!question) {
    renderEndPage();
    return;
  }

  // Load in the question category and text
  document.getElementById("questionCategory").textContent = question.category;
  document.getElementById("questionText").innerHTML = question.text;

  console.log("Current question difficulty:", question.difficulty);

  // Clearing the old choice container
  const container = document.getElementById("choicesContainer");
  container.innerHTML = "";

  // Mapping out the answers for the new question
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
  // Referencing other buttons  
  const submitBtn = document.getElementById("submitBtn");
  const selectedBtn = document.querySelector(".choice-btn.selected");

  // Error Handling
  if (!selectedBtn) {
    alert("Please select an answer before submitting!");
    return;
  }

  // Evaluate the answer
  const userAnswer = selectedBtn.textContent;
  const isCorrect = currentQuestion.checkAnswer(userAnswer);
  currentUser.updateScore(isCorrect, userAnswer, currentQuestion.category, currentQuestion.text, currentQuestion.difficulty);
  document.getElementById("displayScore").textContent = currentUser.score;
  selectedBtn.style.backgroundColor = isCorrect ? "#44ea44" : "red";

  // Handling the answer evaluation
  if (!isCorrect) {
    handleIncorrect();
    const correctBtn = Array.from(document.querySelectorAll(".choice-btn"))
      .find(btn => btn.textContent === currentQuestion.correct);
    if (correctBtn) correctBtn.style.backgroundColor = "#44ea44";
  }
  else {
    handleCorrect()
  }

  // Update button states
  document.querySelectorAll(".choice-btn").forEach(btn => btn.disabled = true);
  submitBtn.disabled = true;
}

function handleNextQuestion() {
  // Referencing other buttons  
  const submitBtn = document.getElementById("submitBtn");
  const selectedBtn = document.querySelector(".choice-btn.selected");

  // Error Handling
  if (!(submitBtn.disabled == true)) {
    if (!selectedBtn){
        alert("Please submit an answer to this question. Never hurts to take a guess! :)");
        return;
    }
    alert("Please submit your answer first before proceeding.");
    return;
  }

  //Update submit button state
  submitBtn.disabled = false;

  currentQuestion = currentQuiz.nextQuestion();
  renderQuestion(currentQuestion);
}

async function handleCorrect(){
    incorrectStreak = 0;
    correctStreak++;
    console.log("Correct streak is", correctStreak);
    var newDiff = null;

    // Check if the user has correctly answered 5 questions in a row, and make needed difficulty adjustments
    if (correctStreak == 5 && currentUser.difficulty != 'hard'){
        correctStreak = 0;
        if (currentUser.difficulty == 'easy'){newDiff = 'medium'}
        if (currentUser.difficulty == 'medium'){newDiff = 'hard'}
        document.getElementById("displayDifficulty").textContent = newDiff;
        await handleDifficultyChange.call(currentQuiz, newDiff); // using call()
    }
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = false;
}

async function handleIncorrect(){
    correctStreak = 0;
    incorrectStreak++;
    console.log("Incorrect streak is", incorrectStreak);
    var newDiff = null;

    // Check if the user has missed 5 questions in a row, and make needed difficulty adjustments
    if (incorrectStreak == 5 && currentUser.difficulty != 'easy'){
        incorrectStreak = 0;
        if (currentUser.difficulty == 'medium'){newDiff = 'easy'}
        if (currentUser.difficulty == 'hard'){newDiff = 'medium'}
        document.getElementById("displayDifficulty").textContent = newDiff;
        await handleDifficultyChange.call(currentQuiz, newDiff); // using call()
    }
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = false;
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
