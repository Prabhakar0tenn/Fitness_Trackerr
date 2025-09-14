// public/scripts/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  const stored = localStorage.getItem('currentUser');
  if (!stored) {
    window.location.href = 'index.html';
    return;
  }
  let currentUser = JSON.parse(stored);
  const username = currentUser.username;

  // Elements
  const goalDaysInput = document.getElementById('goalDays');
  const setGoalBtn = document.getElementById('setGoalBtn');
  const chooseSpiritBtn = document.getElementById('chooseSpiritBtn');
  const goalProgressEl = document.getElementById('goalProgress');
  const goalProgressBar = document.getElementById('goalProgressBar');
  const goalMessage = document.getElementById('goalMessage');
  const calendarGrid = document.getElementById('calendarGrid');
  const currentMonthTitle = document.getElementById('currentMonth');
  const openTodayWorkout = document.getElementById('openTodayWorkout');
  const modalTitle = document.getElementById('modalSpiritTitle');
  const modalDesc = document.getElementById('modalSpiritDesc');
  const modalExerciseList = document.getElementById('modalExerciseList');
  const completeBtn = document.getElementById('completeWorkoutBtn');
  const uncompleteBtn = document.getElementById('uncompleteWorkoutBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  const monthLabels = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth(); // 0-indexed
  let userData = null;

  const spiritExercisesMap = {
    'Lion': ['Push-ups: 3 x 10', 'Squats: 3 x 15', 'Plank: 3 x 40s'],
    'Eagle': ['Pull-ups (or negatives): 3 x 6', 'Lunges: 3 x 12', 'Mountain Climbers: 3 x 30s'],
    'Wolf': ['Diamond Push-ups: 3 x 8', 'Glute Bridge: 3 x 15', 'Leg Raises: 3 x 12'],
    'Bear': ['Decline Push-ups: 3 x 10', 'Calf Raises: 3 x 20', 'Side Plank: 3 x 30s'],
    // fallback default
    'default': ['Push-ups: 3 x 8', 'Squats: 3 x 12', 'Plank: 3 x 30s']
  };

  // Utility
  function formatDateKey(year, monthIndex, day) {
    const mm = String(monthIndex + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // Fetch user full data from server
  async function fetchUser() {
    try {
      const res = await fetch(`/api/progress/${username}`);
      if (!res.ok) throw new Error('Could not fetch user');
      const data = await res.json();
      userData = data;
      localStorage.setItem('currentUser', JSON.stringify(data));
      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // Set goal
  setGoalBtn.addEventListener('click', async () => {
    const val = Number(goalDaysInput.value) || 0;
    if (val <= 0) return alert('Enter a valid number of days');
    try {
      const res = await fetch('/api/setGoal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, goalDays: val })
      });
      if (res.ok) {
        const updated = await res.json();
        userData = updated;
        localStorage.setItem('currentUser', JSON.stringify(updated));
        renderGoal();
        alert('Goal saved! Now choose your spirit (or click Choose Spirit).');
      } else {
        alert('Failed to set goal.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  });

  chooseSpiritBtn.addEventListener('click', () => {
    // go to spirit selection page
    window.location.href = 'spirit.html';
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  });

  // Render goal UI
  function renderGoal() {
    if (!userData) return;
    const g = Number(userData.goalDays) || 0;
    if (g > 0) {
      goalProgressEl.style.display = 'block';
      const completed = Number(userData.daysCompleted) || 0;
      const percent = Math.min(Math.round((completed / g) * 100), 100);
      goalProgressBar.style.width = `${percent}%`;
      goalProgressBar.textContent = `${percent}%`;
      goalMessage.textContent = `${g - completed} days left to complete your ${g}-day goal. Current streak: ${userData.streak || 0} days.`;
      goalDaysInput.value = g;
    } else {
      goalProgressEl.style.display = 'none';
      goalDaysInput.value = 7;
    }
  }

  // Render calendar for viewMonth/viewYear
  function renderCalendar() {
    calendarGrid.innerHTML = '';
    currentMonthTitle.textContent = `${monthLabels[viewMonth]} ${viewYear}`;

    // headers
    const headers = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    headers.forEach(h => {
      const hEl = document.createElement('div');
      hEl.className = 'calendar-day-header';
      hEl.textContent = h;
      calendarGrid.appendChild(hEl);
    });

    // number of days and first day index
    const first = new Date(viewYear, viewMonth, 1);
    const firstIndex = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // empty placeholders
    for (let i=0;i<firstIndex;i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-day';
      empty.style.visibility = 'hidden';
      calendarGrid.appendChild(empty);
    }

    // Fill days
    const completedSet = new Set(userData?.completedDates || []);
    for (let d=1; d<=daysInMonth; d++) {
      const day = document.createElement('div');
      day.className = 'calendar-day';
      day.textContent = d;
      const key = formatDateKey(viewYear, viewMonth, d);
      if (completedSet.has(key)) {
        day.classList.add('completed');
      }
      // mark today style
      const now = new Date();
      if (now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === d) {
        day.classList.add('today');
      }

      day.addEventListener('click', async () => {
        // toggle completion for that date
        try {
          if (!day.classList.contains('completed')) {
            const res = await fetch('/api/saveDay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, date: key })
            });
            if (res.ok) {
              const updated = await res.json();
              userData = updated;
              day.classList.add('completed');
              renderGoal();
            } else {
              alert('Could not save day.');
            }
          } else {
            // remove
            const res = await fetch('/api/removeDay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, date: key })
            });
            if (res.ok) {
              const updated = await res.json();
              userData = updated;
              day.classList.remove('completed');
              renderGoal();
            } else {
              alert('Could not remove day.');
            }
          }
        } catch (err) {
          console.error(err);
          alert('Network error');
        }
      });

      calendarGrid.appendChild(day);
    }
  }

  document.getElementById('prevMonth').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  // Open today's workout modal
  openTodayWorkout.addEventListener('click', () => {
    // show modal with selected animal exercises
    const selected = userData?.selectedAnimal;
    const exercises = spiritExercisesMap[selected] || spiritExercisesMap['default'];
    modalTitle.textContent = (selected ? `${selected} Workout` : 'Daily Workout');
    modalDesc.textContent = selected ? `Channel your inner ${selected}` : 'Simple daily routine';
    modalExerciseList.innerHTML = '';
    exercises.forEach(ex => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.textContent = ex;
      modalExerciseList.appendChild(li);
    });

    const modalEl = new bootstrap.Modal(document.getElementById('workoutModal'));
    modalEl.show();
  });

  // Complete today's workout (mark today)
  completeBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/saveDay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, date: todayKey() })
      });
      if (res.ok) {
        userData = await res.json();
        localStorage.setItem('currentUser', JSON.stringify(userData));
        renderCalendar();
        renderGoal();
        alert('Marked as completed for today ✅');
      } else {
        alert('Could not mark completed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  });

  // Unmark today's workout
  uncompleteBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/removeDay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, date: todayKey() })
      });
      if (res.ok) {
        userData = await res.json();
        localStorage.setItem('currentUser', JSON.stringify(userData));
        renderCalendar();
        renderGoal();
        alert('Unmarked for today ✅');
      } else {
        alert('Could not remove mark');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  });

  // initial load
  (async () => {
    await fetchUser();
    renderGoal();
    renderCalendar();
  })();

});
