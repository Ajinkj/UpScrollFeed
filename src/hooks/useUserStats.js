"use client"
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot, collection, query, getDocs } from 'firebase/firestore';

export const useUserStats = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [gameStats, setGameStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setGameStats({});
      setLoading(false);
      return;
    }

    // Listen to user profile (total XP, streak, etc)
    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (docSn) => {
      if (docSn.exists()) {
        setProfile({ id: docSn.id, ...docSn.data() });
      } else {
        setProfile(null);
      }
    });

    // Fetch individual game stats
    const fetchGameStats = async () => {
      const q = query(collection(db, "users", user.uid, "games"));
      const snapshot = await getDocs(q);
      const stats = {};
      snapshot.forEach(docSn => {
        stats[docSn.id] = docSn.data();
      });
      setGameStats(stats);
      setLoading(false);
    };

    fetchGameStats();

    return () => {
      unsubProfile();
    };
  }, [user]);

  return { profile, gameStats, loading };
};
