function showPage(pageId, event) {
    if (event) {
        event.preventDefault();
    }

    // 1. Hide EVERY section that is a <main> tag (this prevents the overlapping)
    document.querySelectorAll('main').forEach(page => {
        page.style.display = 'none';
    });

    // 2. Remove "active" styling from all navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });

    // 3. Show only the page we requested
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.style.display = 'block';
    }

    // 4. Highlight the menu link we clicked
    if (event && event.target && event.target.tagName === 'A') {
        event.target.classList.add('active');
    }

    // 5. Run specific features if we open the Routine or Album pages
    if (pageId === 'routine' && typeof renderRoutine === 'function') {
        checkDailyReboot();
        renderRoutine();
    }
    if (pageId === 'album' && typeof renderMemories === 'function') {
        renderMemories();
    }
}

/* --- Memory Match Game Logic --- */

// North East region themed items (Tea, Bamboo, Hornbill, Orange)
const cardItems = ['🍵', '🎋', '🦤', '🍊'];
let cards = [...cardItems, ...cardItems]; // Duplicate for pairs
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let matchedPairs = 0;

function startMemoryMatch(event) {
    if(event) event.preventDefault();
    
    // Hide all pages, show only memory game
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('games-page').style.display = 'none';
    document.getElementById('memory-match-game').style.display = 'block';
    
    initMemoryMatch();
}

function initMemoryMatch() {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = ''; // Clear previous board
    matchedPairs = 0;
    document.getElementById('match-score').innerText = matchedPairs;
    document.getElementById('restart-btn').style.display = 'none';
    
    // Shuffle cards
    cards.sort(() => 0.5 - Math.random());

    // Generate card HTML
    cards.forEach(item => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('memory-card');
        cardElement.dataset.framework = item;

        cardElement.innerHTML = `
            <div class="card-face card-front">${item}</div>
            <div class="card-face card-back"></div>
        `;
        
        cardElement.addEventListener('click', flipCard);
        grid.appendChild(cardElement);
    });
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flip');

    if (!hasFlippedCard) {
        // First click
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    // Second click
    secondCard = this;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.framework === secondCard.dataset.framework;

    if (isMatch) {
        disableCards();
        matchedPairs++;
        document.getElementById('match-score').innerText = matchedPairs;
        
        // Check if game is won
        if (matchedPairs === cardItems.length) {
            setTimeout(() => {
                document.getElementById('restart-btn').style.display = 'inline-block';
            }, 500);
        }
    } else {
        unflipCards();
    }
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    resetBoard();
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetBoard();
    }, 1000); // 1 second delay to memorize
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}
/* --- Word Recall Game Logic --- */
const recallWords = ['Flower', 'Basket', 'Bridge', 'Umbrella'];
const decoyWords = ['River', 'Tea', ...recallWords].sort(() => 0.5 - Math.random());

function startWordRecall(event) {
    if(event) event.preventDefault();
    document.querySelectorAll('main').forEach(m => m.style.display = 'none');
    document.getElementById('word-recall-game').style.display = 'block';
    
    // Reset views
    document.getElementById('wr-phase-1').style.display = 'block';
    document.getElementById('wr-phase-2').style.display = 'none';
    document.getElementById('wr-phase-3').style.display = 'none';
    document.getElementById('wr-instructions').style.display = 'block';
}

function goToWordRecallPhase2() {
    document.getElementById('wr-phase-1').style.display = 'none';
    document.getElementById('wr-instructions').style.display = 'none';
    document.getElementById('wr-phase-2').style.display = 'block';
    
    // Generate checkboxes
    const checklist = document.getElementById('wr-checklist');
    checklist.innerHTML = '';
    decoyWords.forEach(word => {
        checklist.innerHTML += `
            <label class="checklist-label">
                <input type="checkbox" value="${word}"> ${word}
            </label>
        `;
    });
}

function showWordRecallResults() {
    const checkboxes = document.querySelectorAll('#wr-checklist input:checked');
    let correctCount = 0;
    
    checkboxes.forEach(box => {
        if (recallWords.includes(box.value)) correctCount++;
    });

    document.getElementById('wr-phase-2').style.display = 'none';
    document.getElementById('wr-phase-3').style.display = 'block';
    document.getElementById('wr-result-title').innerText = `You remembered ${correctCount} of 4`;
}

/* --- Daily Orientation Game Logic --- */
const orientationQuestions = [
    {
        q: "Which month are we in?",
        r: "এতিয়া কোনটো মাহ?",
        options: ["October", "November", "December", "January"]
    },
    {
        q: "What season is it right now?",
        r: "এতিয়া কোনটো ঋতু চলি আছে?",
        options: ["Summer (গ্ৰীষ্ম)", "Monsoon (বৰ্ষা)", "Winter (শীত)"]
    },
    {
        q: "Are we currently at home?",
        r: "আমি বৰ্তমান ঘৰত আছো নেকি?",
        options: ["Yes (হয়)", "No (নহয়)"]
    }
];

let currentQuestion = 0;

function startDailyOrientation(event) {
    if(event) event.preventDefault();
    document.querySelectorAll('main').forEach(m => m.style.display = 'none');
    document.getElementById('daily-orientation-game').style.display = 'block';
    currentQuestion = 0;
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestion >= orientationQuestions.length) {
        showPage('games'); // Go back to games when done
        return;
    }

    const qData = orientationQuestions[currentQuestion];
    document.getElementById('do-progress').innerText = `Question ${currentQuestion + 1} of ${orientationQuestions.length}`;
    document.getElementById('do-question').innerText = qData.q;
    document.getElementById('do-regional').innerText = qData.r;

    const optionsContainer = document.getElementById('do-options');
    optionsContainer.innerHTML = '';
    
    qData.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            currentQuestion++;
            loadQuestion();
        };
        optionsContainer.appendChild(btn);
    });
}
/* --- Daily Routine & Heatmap Logic --- */
let routineTasks = JSON.parse(localStorage.getItem('routineTasks')) || [];
let routineHistory = JSON.parse(localStorage.getItem('routineHistory')) || {};
let lastRoutineDate = localStorage.getItem('lastRoutineDate') || new Date().toDateString();

// Check for Daily Reboot
function checkDailyReboot() {
    const today = new Date().toDateString();
    
    // If it's a new day, save yesterday's progress and reset all tasks
    if (today !== lastRoutineDate) {
        const total = routineTasks.length;
        const completed = routineTasks.filter(t => t.completed).length;
        
        // Save to history
        routineHistory[lastRoutineDate] = { total, completed };
        localStorage.setItem('routineHistory', JSON.stringify(routineHistory));

        // Uncheck everything for the new day
        routineTasks.forEach(t => t.completed = false);
        localStorage.setItem('routineTasks', JSON.stringify(routineTasks));
        
        // Update tracker date
        lastRoutineDate = today;
        localStorage.setItem('lastRoutineDate', lastRoutineDate);
    }
}



function formatTime(timeStr) {
    if (!timeStr) return '';
    let [h, m] = timeStr.split(':');
    let ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
}

function renderRoutine() {
    const container = document.getElementById('active-tasks-container');
    const suggestions = document.getElementById('routine-suggestions');
    const progressText = document.getElementById('routine-progress');
    
    container.innerHTML = '';
    
    if (routineTasks.length === 0) {
        suggestions.style.display = 'block';
        progressText.innerText = "0 of 0 done";
    } else {
        suggestions.style.display = 'none';
        let completedCount = 0;
        
        routineTasks.forEach((task, index) => {
            if (task.completed) completedCount++;
            
            const taskEl = document.createElement('div');
            taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskEl.innerHTML = `
                <div class="task-left">
                    <div class="check-circle" onclick="toggleTask(${index})">✓</div>
                    <div class="task-text">
                        <div class="task-title">${task.name}</div>
                        <div class="task-meta">${formatTime(task.time)} · ${task.category}</div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="icon-btn" style="color: var(--accent-teal);">🔔</button>
                    <button class="icon-btn" onclick="deleteTask(${index})">🗑️</button>
                </div>
            `;
            container.appendChild(taskEl);
        });
        
        progressText.innerText = `${completedCount} of ${routineTasks.length} done`;
    }

    renderHeatmap();
}

function renderHeatmap() {
    const heatmapContainer = document.getElementById('heatmap-container');
    heatmapContainer.innerHTML = '';
    
    // Generate the last 7 days including today
    for (let i = 6; i >= 0; i--) {
        let d = new Date();
        d.setDate(d.getDate() - i);
        let dateStr = d.toDateString();
        
        let data = routineHistory[dateStr];
        // If it's today, look at live data
        if (dateStr === lastRoutineDate) {
            data = {
                total: routineTasks.length,
                completed: routineTasks.filter(t => t.completed).length
            };
        }

        let boxClass = '';
        if (data && data.total > 0) {
            const ratio = data.completed / data.total;
            if (data.completed === data.total) {
                boxClass = 'hm-green'; // All done
            } else if (data.completed === 0) {
                boxClass = 'hm-red'; // None done
            } else if (data.completed <= 2) {
                boxClass = 'hm-orange'; // 1-2 done
            } else {
                boxClass = 'hm-yellow'; // Most done
            }
        }

        const box = document.createElement('div');
        box.className = `heatmap-box ${boxClass}`;
        box.innerText = d.getDate(); // Just show the day number
        heatmapContainer.appendChild(box);
    }
}

function toggleTask(index) {
    routineTasks[index].completed = !routineTasks[index].completed;
    saveAndRenderRoutine();
}

function deleteTask(index) {
    routineTasks.splice(index, 1);
    saveAndRenderRoutine();
}

function addNewTask() {
    const name = document.getElementById('new-task-name').value;
    const cat = document.getElementById('new-task-category').value;
    const time = document.getElementById('new-task-time').value;
    
    if (!name) return alert('Please enter a task name');
    
    routineTasks.push({ name, category: cat, time, completed: false });
    document.getElementById('new-task-name').value = '';
    document.getElementById('new-task-time').value = '';
    saveAndRenderRoutine();
}

function addSuggestedTask(name, category, time) {
    routineTasks.push({ name, category, time, completed: false });
    saveAndRenderRoutine();
}

function saveAndRenderRoutine() {
    localStorage.setItem('routineTasks', JSON.stringify(routineTasks));
    renderRoutine();
}

function requestNotification() {
    alert("mind-spark-ner.lovable.app wants to send you notifications.\n\n(In a real app, this triggers the browser Push API!)");
}
/* --- Memory Album Logic --- */
let memories = JSON.parse(localStorage.getItem('memoryAlbum')) || [];



function addMemory() {
    const title = document.getElementById('album-title').value;
    const subtitle = document.getElementById('album-subtitle').value;
    const story = document.getElementById('album-story').value;
    const photoInput = document.getElementById('album-photo');

    if (!title) return alert('Please add a title (Who or what is this?)');

    if (photoInput.files && photoInput.files[0]) {
        // Read file as a data URL to store locally
        const reader = new FileReader();
        reader.onload = function(e) {
            saveMemoryAndRender({ title, subtitle, story, photo: e.target.result });
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        // Save without a photo (uses the leaf placeholder)
        saveMemoryAndRender({ title, subtitle, story, photo: null });
    }
}

function saveMemoryAndRender(memoryObj) {
    memories.unshift(memoryObj); // Add to the top of the feed
    localStorage.setItem('memoryAlbum', JSON.stringify(memories));
    
    // Clear inputs
    document.getElementById('album-title').value = '';
    document.getElementById('album-subtitle').value = '';
    document.getElementById('album-story').value = '';
    document.getElementById('album-photo').value = '';

    renderMemories();
}

function renderMemories() {
    const container = document.getElementById('memory-feed-container');
    container.innerHTML = '';

    memories.forEach((mem, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';

        // Check if there is an image, otherwise show the gradient + leaf placeholder
        const imgHTML = mem.photo 
            ? `<img src="${mem.photo}" alt="${mem.title}">` 
            : `<div style="font-size: 3rem;">🌿</div>`; 

        card.innerHTML = `
            <div class="memory-img-container">
                ${imgHTML}
            </div>
            <div class="memory-content">
                <h3 class="memory-title">${mem.title}</h3>
                <div class="memory-subtitle">${mem.subtitle}</div>
                <p class="memory-story">${mem.story}</p>
                <button class="remove-memory-btn" onclick="deleteMemory(${index})">
                    🗑️ Remove
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function deleteMemory(index) {
    memories.splice(index, 1);
    localStorage.setItem('memoryAlbum', JSON.stringify(memories));
    renderMemories();
}
function showPage(pageId, event) {
    if (event) event.preventDefault();

    // 1. Check if user is trying to access private data without logging in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isPrivatePage = (pageId === 'routine' || pageId === 'album');
    
    if (isPrivatePage && !isLoggedIn) {
        alert("Please sign in to keep your personal data secure.");
        pageId = 'signin'; // Force redirect to login screen
    }

    // 2. Hide EVERY section
    document.querySelectorAll('main').forEach(page => {
        page.style.display = 'none';
    });

    // 3. Remove "active" styling from navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });

    // 4. Show requested page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) targetPage.style.display = 'block';

    // 5. Highlight menu link
    if (event && event.target && event.target.tagName === 'A') {
        event.target.classList.add('active');
    }

    // 6. Run specific features
    if (pageId === 'routine' && typeof renderRoutine === 'function') {
        checkDailyReboot();
        renderRoutine();
    }
    if (pageId === 'album' && typeof renderMemories === 'function') {
        renderMemories();
    }

    updateAuthButton();
}

function handleLogin() {
    // Simulate successful login
    localStorage.setItem('isLoggedIn', 'true');
    updateAuthButton();
    showPage('home'); // Send them back to home after login
}

function handleLogout(event) {
    if (event) event.preventDefault();
    localStorage.setItem('isLoggedIn', 'false');
    updateAuthButton();
    showPage('home'); 
}

function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    if (!authBtn) return;
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        authBtn.innerText = 'Sign out';
        authBtn.onclick = handleLogout;
        authBtn.style.backgroundColor = 'transparent';
        authBtn.style.color = 'var(--text-primary)';
        authBtn.style.border = '1px solid #ccc';
    } else {
        authBtn.innerText = 'Sign in';
        authBtn.onclick = (e) => showPage('signin', e);
        authBtn.style.backgroundColor = 'var(--accent-teal)';
        authBtn.style.color = 'white';
        authBtn.style.border = 'none';
    }
}


function updateCaregiverDashboard() {
  // 1. Fetch history from local storage (fallback to empty array if none exists)
  const history = JSON.parse(localStorage.getItem('gameHistory')) || [];

  if (history.length === 0) return; // Exit if no data yet

  // 2. Calculate Total Sessions
  const totalSessions = history.length;
  document.getElementById('calc-sessions').textContent = totalSessions;

  // 3. Calculate Days Practiced (counting unique dates)
  const uniqueDates = new Set(history.map(session => {
    // Assuming session.date is stored as an ISO string or timestamp
    return new Date(session.date).toDateString();
  }));
  document.getElementById('calc-days').textContent = uniqueDates.size;

  // 4. Calculate Average Accuracy across all games
  const totalAccuracy = history.reduce((sum, session) => sum + session.accuracy, 0);
  const avgAccuracy = Math.round(totalAccuracy / totalSessions);
  document.getElementById('calc-accuracy').textContent = `${avgAccuracy}%`;

  // 5. Calculate Per-Game Stats (Example for Memory Match)
  const memoryMatchSessions = history.filter(s => s.game === 'Memory Match');
  if (memoryMatchSessions.length > 0) {
    const mmTotalAcc = memoryMatchSessions.reduce((sum, s) => sum + s.accuracy, 0);
    const mmAvgAcc = Math.round(mmTotalAcc / memoryMatchSessions.length);
    
    // Update the DOM for Memory Match specifically
    // (You would add an ID like 'stat-memory-match' to that specific text element)
    document.getElementById('stat-memory-match').textContent = 
      `${memoryMatchSessions.length} sessions · ${mmAvgAcc}% average`;
  }
}