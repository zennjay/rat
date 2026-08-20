const firebaseConfig = {
  apiKey: "AIzaSy_PLACEHOLDER_KEY", // Normally injected or fetched
  authDomain: "produk-9ada7.firebaseapp.com",
  databaseURL: "https://produk-9ada7-default-rtdb.firebaseio.com/",
  projectId: "produk-9ada7",
  storageBucket: "produk-9ada7.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

console.log("Firebase Initialized");
