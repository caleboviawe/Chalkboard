// Defining Classes

class User {
  constructor(name) {
    this.name = name;
    this.score = 0;
    this.difficulty = null;
    this.history = []; // optional for storing past scores
  }

  updateScore(points) {
    this.score += points;
  }
}

class Question {
  constructor(text, choices, correctAnswer) {
    this.text = text;
    this.choices = choices;
    this.correctAnswer = correctAnswer;
  }

  checkAnswer(answer) {
    return answer === this.correctAnswer;
  }
}

class Quiz {
  constructor(questions = []) {
    this.questions = questions;
    this.currentQuestionIndex = 0;
    this.score = 0;
  }

  addQuestion(question) {
    this.questions.push(question);
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex];
  }

  submitAnswer(answer) {
    const question = this.getCurrentQuestion();
    if (question.checkAnswer(answer)) {
      this.score++;
    }
    this.currentQuestionIndex++;
  }

  isFinished() {
    return this.currentQuestionIndex >= this.questions.length;
  }
}

// Grab chalkboard div
const chalkboard = document.getElementById('chalkboard');

// Store current user info globally for now
let currentUser = null;

// --- Initial Homepage ---
function renderHomePage() {
  chalkboard.innerHTML = `
    <h1 class="welcome-title">Welcome to SmartBoard!</h1>
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

    // For now just log it
    console.log("User info saved:", currentUser);

    // TODO: Move to next quiz state (renderQuizPage())
    // renderQuizPage()
  });
}

// --- Initialize app ---
renderHomePage();
