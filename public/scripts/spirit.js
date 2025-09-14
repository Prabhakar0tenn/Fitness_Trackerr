// public/scripts/spirit.js
document.addEventListener('DOMContentLoaded', async () => {
  // Make sure user is logged in
  const stored = localStorage.getItem('currentUser');
  if (!stored) {
    window.location.href = 'index.html';
    return;
  }
  const currentUser = JSON.parse(stored);
  const username = currentUser.username;

  // Define spirits + exercises
  const spirits = [
    { name: 'Lion', img: 'images/shark.jpg', exercises: ['Push-ups: 3 sets x 10', 'Squats: 3 x 15', 'Plank: 3 x 40s'] },
    { name: 'Eagle', img: 'images/dragon.jpg', exercises: ['Pull-ups (or negatives): 3 x 6', 'Lunges: 3 x 12', 'Mountain Climbers: 3 x 30s'] },
    { name: 'Wolf', img: 'images/wolf.jpg', exercises: ['Diamond Push-ups: 3 x 8', 'Glute Bridge: 3 x 15', 'Leg Raises: 3 x 12'] },
    { name: 'Bear', img: 'images/bear.jpg', exercises: ['Decline Push-ups: 3 x 10', 'Calf Raises: 3 x 20', 'Side Plank: 3 x 30s each'] },
    // add more mapping to your existing images
  ];

  const container = document.getElementById('spiritContainer');

  spirits.forEach(s => {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    col.innerHTML = `
      <div class="card spirit-card glass-card h-100">
        <img src="${s.img}" class="card-img-top" alt="${s.name}">
        <div class="card-body">
          <h5 class="card-title text-white">${s.name}</h5>
          <p class="card-text text-white">Daily routine to channel a ${s.name}.</p>
          <button class="btn glass-btn select-spirit">Select</button>
        </div>
      </div>
    `;
    col.querySelector('.select-spirit').addEventListener('click', async () => {
      try {
        const res = await fetch('/api/selectAnimal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, selectedAnimal: s.name })
        });
        if (res.ok) {
          const updated = await res.json();
          localStorage.setItem('currentUser', JSON.stringify(updated));
          // After selection, redirect to dashboard
          window.location.href = 'dashboard.html';
        } else {
          alert('Error selecting spirit. Try again.');
        }
      } catch (err) {
        console.error(err);
        alert('Network error.');
      }
    });

    container.appendChild(col);
  });
});
