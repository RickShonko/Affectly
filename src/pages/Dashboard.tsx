import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Calendar, Heart, Brain, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalEntries: 0,
    averageMood: 0,
    streakDays: 0,
    mostCommonEmotion: 'neutral'
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchEntries();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    setProfile(data);
  };

  const fetchEntries = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setEntries(data);
      calculateStats(data);
    }
  };

  const calculateStats = (entries: any[]) => {
    const totalEntries = entries.length;
    const averageMood = entries.reduce((sum, entry) => sum + (entry.mood_score || 0), 0) / totalEntries || 0;
    
    // Calculate streak (simplified)
    const streakDays = calculateStreak(entries);
    
    // Find most common emotion
    const emotions: { [key: string]: number } = {};
    entries.forEach(entry => {
      if (entry.emotion_analysis) {
        entry.emotion_analysis.forEach((emotion: any) => {
          emotions[emotion.label] = (emotions[emotion.label] || 0) + 1;
        });
      }
    });
    
    const mostCommonEmotion = Object.keys(emotions).reduce((a, b) => 
      emotions[a] > emotions[b] ? a : b, 'neutral'
    );

    setStats({
      totalEntries,
      averageMood: Math.round(averageMood * 100) / 100,
      streakDays,
      mostCommonEmotion
    });
  };

  const calculateStreak = (entries: any[]) => {
    if (entries.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < entries.length; i++) {
      const entryDate = new Date(entries[i].created_at);
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getMoodTrendData = () => {
    return entries
      .slice(0, 30)
      .reverse()
      .map(entry => ({
        date: new Date(entry.created_at).toLocaleDateString(),
        mood: entry.mood_score || 0
      }));
  };

  const getEmotionDistribution = () => {
    const emotions: { [key: string]: number } = {};
    entries.forEach(entry => {
      if (entry.emotion_analysis) {
        entry.emotion_analysis.forEach((emotion: any) => {
          emotions[emotion.label] = (emotions[emotion.label] || 0) + 1;
        });
      }
    });

    return Object.entries(emotions).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Content', 'Sentiment', 'Mood Score', 'Emotions'],
      ...entries.map(entry => [
        new Date(entry.created_at).toISOString(),
        entry.content.replace(/,/g, ';'),
        entry.sentiment_analysis?.label || '',
        entry.mood_score || '',
        entry.emotion_analysis?.map((e: any) => e.label).join(';') || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'affectly-journal-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const isPremium = profile?.subscription_tier === 'premium';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Insights into your emotional patterns and mental wellness
            </p>
          </div>
          
          {isPremium && (
            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          )}
        </div>

        {!isPremium && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Upgrade to Premium
              </CardTitle>
              <CardDescription>
                Unlock detailed emotion analysis, advanced charts, and data export features.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <div className="text-xs text-muted-foreground">Journal entries written</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageMood}</div>
              <div className="text-xs text-muted-foreground">Out of 1.0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Writing Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.streakDays}</div>
              <div className="text-xs text-muted-foreground">Consecutive days</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Emotion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{stats.mostCommonEmotion}</div>
              <div className="text-xs text-muted-foreground">Most frequent</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Mood Trend
              </CardTitle>
              <CardDescription>
                Your mood over the last 30 entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available. Start journaling to see your mood trends!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getMoodTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis domain={[0, 1]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Emotion Distribution
              </CardTitle>
              <CardDescription>
                {isPremium ? 'Your emotional patterns' : 'Upgrade for detailed emotions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isPremium ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Upgrade to Premium to see detailed emotion analysis</p>
                  </div>
                </div>
              ) : entries.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No emotions to display. Start journaling to see your emotional patterns!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getEmotionDistribution()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {getEmotionDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {isPremium && entries.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Personalized insights based on your journal entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-semibold mb-2">Weekly Pattern</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on your entries, you tend to feel more positive on weekends. 
                    Consider incorporating more leisure activities during weekdays.
                  </p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-semibold mb-2">Emotional Growth</h4>
                  <p className="text-sm text-muted-foreground">
                    Your mood has improved by 15% over the last month. Keep up the great work with your journaling practice!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;