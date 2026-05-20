import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /rankings/:communityId - Get rankings for a community
export const getRankings = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: rankings, error } = await supabase
      .from('rankings')
      .select(`
        id,
        rank,
        score,
        user_id,
        users(id, username, display_name, profile_picture_url, user_stats(*))
      `)
      .eq('community_id', communityId)
      .order('rank', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch rankings' });
    }

    return res.status(200).json({ rankings });
  } catch (error) {
    console.error('Get rankings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /rankings - Get all rankings by community
export const getAllRankings = async (req, res) => {
  try {
    const { data: communities, error } = await supabase
      .from('communities')
      .select('id, name, specialization_type');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch communities' });
    }

    const rankingsByComm = {};

    for (const community of communities) {
      const { data: rankings } = await supabase
        .from('rankings')
        .select('rank, score, user_id, users(username, display_name)')
        .eq('community_id', community.id)
        .order('rank', { ascending: true })
        .limit(10);

      rankingsByComm[community.id] = {
        communityName: community.name,
        specialization: community.specialization_type,
        rankings: rankings || []
      };
    }

    return res.status(200).json({ rankings: rankingsByComm });
  } catch (error) {
    console.error('Get all rankings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /rankings/recalculate - Trigger ranking recalculation (admin only)
export const recalculateRankings = async (req, res) => {
  try {
    // This would typically be run as a cron job
    // For now, simple calculation based on stats

    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, user_stats(squat_pr, bench_pr, deadlift_pr, weight)');

    if (userError) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Get all rankings
    const { data: allRankings } = await supabase
      .from('rankings')
      .select('*');

    // Clear existing rankings
    if (allRankings && allRankings.length > 0) {
      await supabase
        .from('rankings')
        .delete()
        .gt('id', 0);
    }

    // Calculate scores for each user
    const scoredUsers = users.map(user => {
      const stats = user.user_stats;
      if (!stats) return { userId: user.id, score: 0 };

      const weight = stats.weight || 1;
      const sq = stats.squat_pr || 0;
      const bp = stats.bench_pr || 0;
      const dl = stats.deadlift_pr || 0;

      // Simple scoring: normalized total
      const total = sq + bp + dl;
      const normalizedScore = (total / weight) * 100;

      return {
        userId: user.id,
        score: Math.round(normalizedScore * 100) / 100
      };
    });

    // Sort by score descending
    scoredUsers.sort((a, b) => b.score - a.score);

    // Insert new rankings (simplified - can add community-based later)
    const newRankings = scoredUsers.map((item, index) => ({
      user_id: item.userId,
      community_id: 'sbl-community', // TODO: per-community ranking
      rank: index + 1,
      score: item.score,
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('rankings')
      .insert(newRankings);

    if (insertError) {
      console.error('Insert ranking error:', insertError);
      return res.status(500).json({ error: 'Failed to insert rankings' });
    }

    return res.status(200).json({
      message: 'Rankings recalculated successfully',
      usersRanked: newRankings.length
    });
  } catch (error) {
    console.error('Recalculate rankings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.get('/:communityId', getRankings);
router.get('/', getAllRankings);
router.post('/recalculate', verifyToken, recalculateRankings);

export default router;
