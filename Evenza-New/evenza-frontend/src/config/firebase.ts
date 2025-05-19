import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAOxJjxaUUMhruNLRsAiovFR5JftyfdL20",
  authDomain: "evenzaa-edb81.firebaseapp.com",
  projectId: "evenzaa-edb81",
  storageBucket: "evenzaa-edb81.firebasestorage.app",
  messagingSenderId: "246181491768",
  appId: "1:246181491768:web:21f58212fa5e4a0a3522cd",
  measurementId: "G-KE35P3BJG2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Configure providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');

// Remove the setPersistence call that's causing the error

export default app;
