// Screens
const splashScreen = document.getElementById('splashScreen');
const roleScreen = document.getElementById('roleScreen');
const controllerScreen = document.getElementById('controllerScreen');
const deviceDashboardScreen = document.getElementById('deviceDashboardScreen');
const addDeviceModal = document.getElementById('addDeviceModal');

// Current user state
let currentRole = null; // 'CONTROLLER' or 'DEVICE'
let deviceId = null;
let html5QrcodeScanner = null;

// Initialize app
setTimeout(() => {
  showScreen(roleScreen);
}, 2000); // 2 second splash

function showScreen(screen) {
  const screens = document.getElementsByClassName('screen');
  for (let i = 0; i < screens.length; i++) {
    screens[i].classList.remove('active');
  }
  screen.classList.add('active');
}

// Role Handlers
document.getElementById('controllerRoleBtn').addEventListener('click', () => {
  currentRole = 'CONTROLLER';
  initController();
});

document.getElementById('deviceRoleBtn').addEventListener('click', () => {
  currentRole = 'DEVICE';
  initDevice();
});

// Controller Logic
function initController() {
  showScreen(controllerScreen);
  loadDevices();
}

function loadDevices() {
  const list = document.getElementById('deviceList');
  list.innerHTML = `
    <div class="device-card" onclick="alert('Open Remote')">
      <div class="device-header">
        <h3>📱 Adik (Demo)</h3>
        <span class="status-badge">ONLINE</span>
      </div>
      <div class="device-stats">
        <span>🔋 87%</span>
        <span>📶 WiFi</span>
      </div>
    </div>
  `;
}

// Device Logic
function initDevice() {
  showScreen(deviceDashboardScreen);
  
  if (window.Android) {
    deviceId = window.Android.getDeviceId();
    document.getElementById('d-name').innerText = window.Android.getDeviceName();
    
    // Setup Native listeners
    setInterval(() => {
      document.getElementById('d-battery').innerText = window.Android.getBattery() + '%';
      document.getElementById('d-storage').innerText = window.Android.getStorage() + ' GB';
    }, 5000);
  } else {
    deviceId = "dev_" + Date.now();
  }
  
  setupFirebasePresence();
}

document.getElementById('generateCodeBtn').addEventListener('click', () => {
  const codeDisplay = document.getElementById('pairingCodeDisplay');
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  codeDisplay.innerText = code;
  codeDisplay.classList.remove('hidden');
  
  // Generate QR Code
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = ""; // clear previous
  new QRCode(qrContainer, {
    text: code,
    width: 200,
    height: 200,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
});

// Native Bridge wrappers
function requestOverlay() {
  if (window.Android) window.Android.openOverlaySettings();
  else alert("Overlay requested");
}

// Lock Timer Variables
let lockTimerInterval = null;
let lockExpirationTime = null;

function testLockApp(minutes) {
  const expiresAt = Date.now() + (minutes * 60 * 1000);
  startAppLock(expiresAt);
}

function startAppLock(expiresAt) {
  document.getElementById('appLockOverlay').classList.add('active');
  document.getElementById('appLockOverlay').classList.remove('hidden');
  document.getElementById('unlockCodeInput').value = '';
  
  if (lockTimerInterval) clearInterval(lockTimerInterval);
  
  lockExpirationTime = expiresAt;
  updateLockTimer();
  lockTimerInterval = setInterval(updateLockTimer, 1000);
}

function updateLockTimer() {
  if (!lockExpirationTime) return;
  
  const now = Date.now();
  const timeLeft = lockExpirationTime - now;
  
  if (timeLeft <= 0) {
    unlockDevice();
    return;
  }
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  document.getElementById('lockTimeLeft').innerText = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function unlockDevice() {
  if (lockTimerInterval) {
    clearInterval(lockTimerInterval);
    lockTimerInterval = null;
  }
  lockExpirationTime = null;
  document.getElementById('appLockOverlay').classList.remove('active');
  document.getElementById('appLockOverlay').classList.add('hidden');
}

// Unlock button handler
document.getElementById('unlockBtn').addEventListener('click', () => {
  const code = document.getElementById('unlockCodeInput').value;
  if (code === '123456') { // Mock check for demo
    unlockDevice();
  } else {
    alert('INVALID ACCESS CODE (Use 123456 for demo)');
  }
});

document.getElementById('testLockBtn').addEventListener('click', () => {
  testLockApp(1); // 1 minute for test
});

function setupFirebasePresence() {
  const connectedRef = db.ref('.info/connected');
  const myConnectionsRef = db.ref(`devices/${deviceId}/status`);
  
  connectedRef.on('value', (snap) => {
    if (snap.val() === true) {
      document.getElementById('d-status').innerText = 'ONLINE';
      document.getElementById('d-status').classList.remove('offline');
      myConnectionsRef.set('ONLINE');
      myConnectionsRef.onDisconnect().set('OFFLINE');
    } else {
      document.getElementById('d-status').innerText = 'OFFLINE';
      document.getElementById('d-status').classList.add('offline');
    }
  });
}

// Add Device Modal Handlers
document.getElementById('addDeviceBtn').addEventListener('click', () => {
  document.getElementById('addDeviceModal').classList.remove('hidden');
  document.getElementById('addDeviceModal').classList.add('active');
});

document.getElementById('closeAddDeviceBtn').addEventListener('click', () => {
  closeAddDeviceModal();
});

function closeAddDeviceModal() {
  document.getElementById('addDeviceModal').classList.add('hidden');
  document.getElementById('addDeviceModal').classList.remove('active');
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear();
    html5QrcodeScanner = null;
    document.getElementById('qr-reader').style.display = 'none';
    document.getElementById('startScanBtn').style.display = 'block';
  }
}

document.getElementById('startScanBtn').addEventListener('click', () => {
  document.getElementById('startScanBtn').style.display = 'none';
  document.getElementById('qr-reader').style.display = 'block';
  
  html5QrcodeScanner = new Html5QrcodeScanner(
    "qr-reader", { fps: 10, qrbox: 250 }
  );
  html5QrcodeScanner.render((decodedText, decodedResult) => {
    // Handle on success
    alert("Scanned Code: " + decodedText);
    closeAddDeviceModal();
    // TODO: implement pairing logic with database
  }, (errorMessage) => {
    // parse error, ignore
  });
});

document.getElementById('manualPairBtn').addEventListener('click', () => {
  const code = document.getElementById('manualPairingCode').value.trim();
  if (!code) {
    alert("Please enter a code");
    return;
  }
  alert("Pairing with Code: " + code);
  closeAddDeviceModal();
});

// Theme Switcher Logic
function applyTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  try {
    localStorage.setItem('selectedTheme', themeName);
  } catch (e) {
    console.warn("localStorage not available", e);
  }
  
  // Update UI selection outline
  document.querySelectorAll('.theme-btn').forEach(btn => {
    if (btn.getAttribute('data-set-theme') === themeName) {
      btn.style.border = '2px solid var(--primary)';
    } else {
      btn.style.border = '2px solid transparent';
    }
  });
}

// Load saved theme on boot
let savedTheme = 'dark';
try {
  savedTheme = localStorage.getItem('selectedTheme') || 'dark';
} catch (e) {
  console.warn("localStorage not available", e);
}
applyTheme(savedTheme);

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const theme = e.target.getAttribute('data-set-theme');
    applyTheme(theme);
  });
});
