import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Charger les données depuis le backend
    const statsResponse = await fetch('http://localhost:4000/api/cubematch/social/stats/cubematch-main', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const commentsResponse = await fetch('http://localhost:4000/api/cubematch/social/comments/cubematch-main', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const leaderboardResponse = await fetch('http://localhost:4000/api/cubematch/leaderboard?limit=10', {
      headers: { 'Content-Type': 'application/json' }
    });

    let socialStats = { likes: 0, shares: 0, views: 0, comments: 0, gamesPlayed: 0 };
    let comments = [];
    let leaderboard = [];

    if (statsResponse.ok) {
      socialStats = await statsResponse.json();
    }

    if (commentsResponse.ok) {
      comments = await commentsResponse.json();
    }

    if (leaderboardResponse.ok) {
      leaderboard = await leaderboardResponse.json();
    }

    return NextResponse.json({
      success: true,
      data: {
        socialStats,
        comments,
        leaderboard
      }
    });

  } catch (error) {
    console.error('Erreur lors du chargement des données sociales:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du chargement des données',
      data: {
        socialStats: { likes: 0, shares: 0, views: 0, comments: 0, gamesPlayed: 0 },
        comments: [],
        leaderboard: []
      }
    }, { status: 500 });
  }
}

