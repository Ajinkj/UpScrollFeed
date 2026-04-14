import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, getDoc } from "firebase/firestore";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user exists in db, if not create basic profile
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        totalXP: 0,
        currentStreak: 0,
        lastLoginDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    } else {
      // Update streak login logic could go here, or handled by a separate hook
    }
    
    return user;
  } catch (error) {
    console.error("Google Sign In Error:", error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Email Login Error:", error);
    throw error;
  }
};

export const registerWithEmail = async (email, password, displayName) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Create initial document
    await setDoc(doc(db, "users", user.uid), {
      displayName: displayName || email.split('@')[0],
      email: user.email,
      totalXP: 0,
      currentStreak: 0,
      lastLoginDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    
    return user;
  } catch (error) {
    console.error("Email Registration Error:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign Out Error:", error);
    throw error;
  }
};
