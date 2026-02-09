// script.js - Rewritten to always use hqdefault.jpg for reliable YouTube thumbnails

console.log("script.js loaded");

const firebaseConfig = {
  apiKey: "AIzaSyBYwgt-Aq-ZJrgSuOphrJryMxtro",
  authDomain: "aeld-b5856.firebaseapp.com",
  projectId: "aeld-b5856",
  storageBucket: "aeld-b5856.appspot.com",
  messagingSenderId: "372163813001",
  appId: "1:372163813001:web:9ed8679669963063c8f058",
  measurementId: "G-3DMJ6NMZNZ"
};

// Load Firebase compat (non-module)
const loadFirebase = () => {
  console.log("Loading Firebase App...");
  const appScript = document.createElement('script');
  appScript.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js";
  appScript.onload = () => {
    console.log("App loaded. Loading Firestore...");
    const firestoreScript = document.createElement('script');
    firestoreScript.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js";
    firestoreScript.onload = () => {
      console.log("Firestore loaded. Initializing...");
      firebase.initializeApp(firebaseConfig);
      window.db = firebase.firestore();
      console.log("Firebase ready!");

      // Render based on page
      if (document.getElementById("levelsBox")) {
        console.log("This is levels.html - rendering unique levels");
        renderUniqueLevels();
      }
      if (document.getElementById("victorsBox")) {
        console.log("This is level-details.html - rendering victors");
        renderLevelVictors();
      }
      if (document.getElementById("playersBox")) {
        console.log("This is players.html - rendering top players");
        renderTopPlayers();
      }
    };
    firestoreScript.onerror = (e) => console.error("Firestore load error:", e);
    document.head.appendChild(firestoreScript);
  };
  appScript.onerror = (e) => console.error("App load error:", e);
  document.head.appendChild(appScript);
};

loadFirebase();

// Helper to get YouTube thumbnail – now always uses hqdefault (reliable)
function getThumbnail(proof) {
  if (!proof) {
    console.log("No proof link — using placeholder");
    return 'https://via.placeholder.com/200x112/0d2432/7fb3c8?text=No+Thumbnail';
  }

  let videoId = '';
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = proof.match(pattern);
    if (match && match[1]) {
      videoId = match[1];
      console.log("Found video ID:", videoId, "from proof:", proof);
      break;
    }
  }

  if (videoId) {
    console.log("Using hqdefault thumbnail for ID:", videoId);
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  console.log("No valid video ID found in proof:", proof);
  return 'https://via.placeholder.com/200x112/0d2432/7fb3c8?text=No+YouTube+Link';
}

// 1. Unique levels on levels.html
function renderUniqueLevels() {
  const box = document.getElementById("levelsBox");
  box.innerHTML = '<p style="text-align:center; color:#7fb3c8; padding:40px;">Loading ranked levels...</p>';

  db.collection("submissions")
    .where("status", "==", "approved")
    .get()
    .then(snapshot => {
      box.innerHTML = "";

      if (snapshot.empty) {
        box.innerHTML = `
          <div class="card" style="text-align:center; padding:40px;">
            No approved levels yet. Approve some in the admin panel! 🏆
          </div>
        `;
        return;
      }

      const levelMap = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        const levelKey = (data.level || "Unnamed Level").trim().toLowerCase();
        if (!levelMap[levelKey]) {
          levelMap[levelKey] = {
            name: data.level || "Unnamed Level",
            rank: data.rank || 999999,
            proof: data.proof || '',
            victors: []
          };
        }
        levelMap[levelKey].victors.push(data);
      });

      const unique = Object.values(levelMap);
      unique.sort((a, b) => a.rank - b.rank);

      let rank = 1;
      unique.forEach(level => {
        const thumb = getThumbnail(level.proof);

        const item = document.createElement("div");
        item.className = "list-item";
        item.style.cursor = "pointer";
        item.innerHTML = `
          <img src="${thumb}" alt="${level.name}" 
               style="width:200px;height:112px;object-fit:cover;border-radius:8px;margin-right:16px;" 
               onerror="console.log('hqdefault failed for ' + '${level.proof}' + ' — using placeholder'); 
                        this.src='https://via.placeholder.com/200x112/0d2432/7fb3c8?text=No+Thumb';">
          <div style="flex:1;">
            <div class="row">
              <div class="rank">#${rank}</div>
              <div>
                <div><b>${level.name}</b></div>
                <div style="color:#7fb3c8;font-size:13px;">
                  ${level.victors.length} victor${level.victors.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>
            <div style="margin-top:8px;">
              <a href="${level.proof}" target="_blank" style="color:#35e0ff;text-decoration:none;">
                First Proof ↗
              </a>
            </div>
          </div>
        `;

        item.onclick = () => {
          console.log("Clicked:", level.name);
          window.location.href = `level-details.html?level=${encodeURIComponent(level.name)}`;
        };

        box.appendChild(item);
        rank++;
      });
    })
    .catch(err => {
      console.error("Levels load error:", err);
      box.innerHTML = `
        <div class="card" style="color:#ff6b6b;text-align:center;padding:20px;">
          Error loading levels: ${err.message}
        </div>
      `;
    });
}

// 2. Victors on level-details.html (unchanged)
function renderLevelVictors() {
  const box = document.getElementById("victorsBox");
  if (!box) return;

  const params = new URLSearchParams(window.location.search);
  const level = params.get("level");
  if (!level) {
    box.innerHTML = '<p style="text-align:center; color:#ff6b6b;padding:40px;">No level selected.</p>';
    return;
  }

  document.getElementById("levelName").innerText = level;

  box.innerHTML = '<p style="text-align:center; color:#7fb3c8;padding:40px;">Loading victors...</p>';

  db.collection("submissions")
    .where("status", "==", "approved")
    .where("level", "==", level)
    .get()
    .then(snapshot => {
      box.innerHTML = "";

      if (snapshot.empty) {
        box.innerHTML = `
          <div class="card" style="text-align:center;padding:40px;">
            No victors for this level yet.
          </div>
        `;
        return;
      }

      let count = 1;
      snapshot.forEach(doc => {
        const data = doc.data();

        const item = document.createElement("div");
        item.className = "list-item";
        item.innerHTML = `
          <div class="row">
            <div class="rank">#${count}</div>
            <div>
              <div><b>${data.player || "Unknown"}</b></div>
              <div style="color:#7fb3c8;font-size:13px;">
                Progress: ${data.completion || "?"}%
              </div>
            </div>
          </div>
          <div>
            <a href="${data.proof || '#'}" target="_blank" style="color:#35e0ff;text-decoration:none;">
              Proof ↗
            </a>
          </div>
        `;

        box.appendChild(item);
        count++;
      });
    })
    .catch(err => {
      console.error("Victors load error:", err);
      box.innerHTML = `
        <div class="card" style="color:#ff6b6b;text-align:center;padding:20px;">
          Error loading victors: ${err.message}
        </div>
      `;
    });
}

// Top players (unchanged)
function renderTopPlayers() {
  const box = document.getElementById("playersBox");
  if (!box) return;

  box.innerHTML = '<p style="text-align:center; color:#7fb3c8;padding:40px;">Loading top players...</p>';

  db.collection("submissions")
    .where("status", "==", "approved")
    .get()
    .then(snapshot => {
      box.innerHTML = "";

      if (snapshot.empty) {
        box.innerHTML = `
          <div class="card" style="text-align:center;padding:40px;">
            No approved completions yet. 🔥
          </div>
        `;
        return;
      }

      const playerCounts = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        const player = data.player || "Unknown";
        playerCounts[player] = (playerCounts[player] || 0) + 1;
      });

      const leaderboard = Object.entries(playerCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

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
    })
    .catch(err => {
      console.error("Players load error:", err);
      box.innerHTML = `
        <div class="card" style="color:#ff6b6b;text-align:center;padding:20px;">
          Error loading players: ${err.message}
        </div>
      `;
    });
}