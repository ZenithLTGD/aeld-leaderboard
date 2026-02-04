// script.js - Shared Firebase loading + sorted rendering for levels & players

if (!window.firebaseLoaded) {
  window.firebaseLoaded = true;

  const loadFirebase = function() {
    const appScript = document.createElement('script');
    appScript.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js";
    appScript.onload = function() {
      const firestoreScript = document.createElement('script');
      firestoreScript.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js";
      firestoreScript.onload = function() {
        const firebaseConfig = {
          apiKey: "AIzaSyBYwgt-Aq-ZJrgSuOphrJryMxtro",
          authDomain: "aeld-b5856.firebaseapp.com",
          projectId: "aeld-b5856",
          storageBucket: "aeld-b5856.appspot.com",
          messagingSenderId: "372163813001",
          appId: "1:372163813001:web:9ed8679669963063c8f058",
          measurementId: "G-3DMJ6NMZNZ"
        };

        firebase.initializeApp(firebaseConfig);
        window.db = firebase.firestore();

        // Auto-call render functions if elements exist
        if (document.getElementById("levelsBox")) window.renderApprovedLevels();
        if (document.getElementById("playersBox")) window.renderTopPlayers();
      };
      document.head.appendChild(firestoreScript);
    };
    document.head.appendChild(appScript);
  };

  loadFirebase();
}

// Render approved levels – LOWEST rank = #1 at top
window.renderApprovedLevels = async function() {
  const box = document.getElementById("levelsBox");
  if (!box) return;

  box.innerHTML = '<p style="text-align:center; color:#7fb3c8; padding:40px;">Loading ranked levels...</p>';

  try {
    const snapshot = await window.db.collection("submissions")
      .where("status", "==", "approved")
      .get();

    box.innerHTML = "";

    if (snapshot.empty) {
      box.innerHTML = `
        <div class="card" style="text-align:center; padding:40px;">
          No approved levels yet. Approve some in the admin panel! 🏆
        </div>
      `;
      return;
    }

    const levels = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      levels.push({
        rank: data.rank || 999999,  // unranked go to bottom
        level: data.level || "Unnamed Level",
        player: data.player || "Unknown",
        completion: data.completion || "?",
        proof: data.proof || '#'
      });
    });

    // SORT: lowest rank first (1 = top/#1, 100 = lower/bottom)
    levels.sort((a, b) => a.rank - b.rank);

    let displayRank = 1;
    levels.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div class="row">
          <div class="rank">#${displayRank}</div>
          <div>
            <div><b>${entry.level}</b></div>
            <div style="color:#7fb3c8; font-size:13px;">
              by ${entry.player} • ${entry.completion}%
            </div>
          </div>
        </div>
        <div>
          <a href="${entry.proof}" target="_blank" style="color:#35e0ff; text-decoration:none;">
            Proof ↗
          </a>
        </div>
      `;

      box.appendChild(item);
      displayRank++;
    });
  } catch (err) {
    console.error("Error loading levels:", err);
    box.innerHTML = `
      <div class="card" style="color:#ff6b6b; text-align:center; padding:20px;">
        Error loading levels: ${err.message || "Check console (F12)"}
      </div>
    `;
  }
};

// Render top players (unchanged)
window.renderTopPlayers = async function() {
  const box = document.getElementById("playersBox");
  if (!box) return;

  box.innerHTML = '<p style="text-align:center; color:#7fb3c8; padding:40px;">Loading top players...</p>';

  try {
    const snapshot = await window.db.collection("submissions")
      .where("status", "==", "approved")
      .get();

    if (snapshot.empty) {
      box.innerHTML = `
        <div class="card" style="text-align:center; padding:40px;">
          No approved completions yet. 🔥
        </div>
      `;
      return;
    }

    const playerCounts = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      const player = data.player || "Unknown";
      playerCounts[player] = (playerCounts[player] || 0) + 1;
    });

    const leaderboard = Object.entries(playerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    box.innerHTML = "";

    leaderboard.forEach((entry, index) => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div class="row">
          <div class="rank">#${index + 1}</div>
          <div><b>${entry.name}</b></div>
        </div>
        <div>${entry.count} record${entry.count === 1 ? "" : "s"}</div>
      `;

      box.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading players:", err);
    box.innerHTML = `
      <div class="card" style="color:#ff6b6b; text-align:center; padding:20px;">
        Error loading players: ${err.message}
      </div>
    `;
  }
};