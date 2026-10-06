import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

let cachedIdToken: string | null = null;

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleAuthProvider);
  cachedIdToken = await result.user.getIdToken();
  return { user: result.user, token: cachedIdToken };
};

export const getIdTokenMemory = async () => {
  if (auth.currentUser) {
    cachedIdToken = await auth.currentUser.getIdToken();
    return cachedIdToken;
  }
  return cachedIdToken;
};

export const signOutFirebase = async () => {
  await auth.signOut();
  cachedIdToken = null;
};
