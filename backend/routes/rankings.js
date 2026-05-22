import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// GET /rankings - Get global leaderboard
export const getRankings = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const { data: stats, error } = await supabaseAdmin
      .from('user_stats')
      .select(`
        user_id,
        weight,
        squat_pr,
        bench_pr,
        deadlift_pr,
        users(id, username, display_name, profile_picture_url)
      `)
      .not('weight', 'is', null)
      .gt('weight', 0);

    if (error) {
      console.error('Rankings fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch rankings' });
    }

    const scored = stats
      .map(s => {
        const sq = s.squat_pr || 0;
        const bp = s.bench_pr || 0;
        const dl = s.deadlift_pr || 0;
        const total = sq + bp + dl;
        if (total === 0) return null;
        const score = Math.round(((total / s.weight) * 100) * 100) / 100;
        return {
          userId: s.user_id,
          score,
          user: {
            id: s.users?.id || s.user_id,
            username: s.users?.username || 'Unknown',
            displayName: s.users?.display_name || s.users?.username || 'Unknown',
            profilePictureUrl: s.users?.profile_picture_url || null,
          },
          stats: {
            weight: s.weight,
            squatPr: s.squat_pr,
            benchPr: s.bench_pr,
            deadliftPr: s.deadlift_pr,
          }
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    const paginated = scored.slice(Number(offset), Number(offset) + Number(limit));

    return res.status(200).json({ rankings: paginated });
  } catch (error) {
    console.error('Get rankings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.get('/', getRankings);

export default router;
