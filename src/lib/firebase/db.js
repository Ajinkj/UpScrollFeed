import { doc, getDoc, updateDoc, increment, setDoc } from "firebase/firestore";
import { db } from "./config";

export const updateUserStats = async (uid, score, gameId, additionalStats = {}) => {
  if (!uid) return;
  const userRef = doc(db, "users", uid);
  const gameStatsRef = doc(db, "users", uid, "games", gameId);
  
  try {
    // 1. Update basic user stats (Total XP)
    await updateDoc(userRef, {
      totalXP: increment(score)
    });
    
    // 2. Update specific game stats
    const gameSnap = await getDoc(gameStatsRef);
    if (!gameSnap.exists()) {
      await setDoc(gameStatsRef, {
        highScore: score,
        playCount: 1,
        lastPlayed: new Date().toISOString(),
        ...additionalStats
      });
    } else {
      const currentData = gameSnap.data();
      const newHighScore = Math.max(currentData.highScore || 0, score);
      
      await updateDoc(gameStatsRef, {
        highScore: newHighScore,
        playCount: increment(1),
        lastPlayed: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("Error updating user stats:", err);
  }
};

export const checkAndUpdateDailyStreak = async (uid) => {
  if (!uid) return;
  const userRef = doc(db, "users", uid);
  const docSnap = await getDoc(userRef);
  
  if (!docSnap.exists()) return;
  
  const data = docSnap.data();
  const lastLoginStr = data.lastLoginDate;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let newStreak = data.currentStreak || 0;
  
  if (lastLoginStr) {
    const lastLoginNode = new Date(lastLoginStr);
    const lastLoginDay = new Date(lastLoginNode.getFullYear(), lastLoginNode.getMonth(), lastLoginNode.getDate());
    
    const msInDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((today - lastLoginDay) / msInDay);
    
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1; // broken streak
    } else if (diffDays === 0 && newStreak === 0) {
      // Very first day just created
      newStreak = 1;
    }
  } else {
    // No last login recorded
    newStreak = 1;
  }
  
  // Record login today
  await updateDoc(userRef, {
    lastLoginDate: new Date().toISOString(),
    currentStreak: newStreak
  });
  
  return newStreak;
};

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (err) {
    console.error("Error fetching user profile", err);
    return null;
  }
}
