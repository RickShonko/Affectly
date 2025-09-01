import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Send, Calendar, TrendingUp, Brain } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Journal = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [todayEntryCount, setTodayEntryCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchEntries();
      checkTodayEntries();
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
    
    setEntries(data || []);
  };

  const checkTodayEntries = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today)
      .lt('created_at', today + 'T23:59:59');
    
    setTodayEntryCount(data?.length || 0);
  };

  const analyzeText = async (text: string) => {
    // This will be replaced with actual Hugging Face API call
    // For now, return a simple mock analysis
    return {
      sentiment: {
        label: 'POSITIVE',
        score: 0.85
      },
      emotions: [
        { label: 'joy', score: 0.7 },
        { label: 'optimism', score: 0.6 }
      ]
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Check entry limits for free users
    if (profile?.subscription_tier === 'free' && todayEntryCount >= 5) {
      toast({
        title: "Entry limit reached",
        description: "Free users can only create 5 entries per day. Upgrade to Premium for unlimited entries.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Analyze the text
      const analysis = await analyzeText(content);
      
      // Save to database
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user?.id,
          content,
          sentiment_analysis: analysis.sentiment,
          emotion_analysis: analysis.emotions,
          mood_score: analysis.sentiment.score
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Entry saved!",
        description: "Your journal entry has been analyzed and saved.",
      });

      setContent('');
      fetchEntries();
      checkTodayEntries();
    } catch (error: any) {
      toast({
        title: "Error saving entry",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canAddEntry = profile?.subscription_tier === 'premium' || todayEntryCount < 5;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Your Journal
          </h1>
          <p className="text-muted-foreground">
            Express your thoughts and emotions. AI will analyze your mood patterns.
          </p>
        </div>

        {!canAddEntry && (
          <Card className="mb-6 border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Daily Entry Limit Reached</CardTitle>
              <CardDescription>
                You've reached your daily limit of 5 entries. Upgrade to Premium for unlimited entries.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Write Your Entry
                </CardTitle>
                <CardDescription>
                  Share what's on your mind today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    placeholder="How are you feeling today? What's happening in your life?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px]"
                    disabled={!canAddEntry}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {content.length} characters
                    </p>
                    <Button type="submit" disabled={loading || !canAddEntry || !content.trim()}>
                      {loading ? "Analyzing..." : "Save & Analyze"}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{todayEntryCount}</div>
                    <div className="text-sm text-muted-foreground">Entries Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {profile?.subscription_tier === 'premium' ? '∞' : '5'}
                    </div>
                    <div className="text-sm text-muted-foreground">Daily Limit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Recent Entries
                </CardTitle>
                <CardDescription>
                  Your emotional journey over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {entries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No entries yet. Start by writing your first journal entry!
                    </p>
                  ) : (
                    entries.map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(entry.created_at).toLocaleDateString()}
                          </div>
                          {entry.sentiment_analysis && (
                            <Badge variant={
                              entry.sentiment_analysis.label === 'POSITIVE' ? 'default' :
                              entry.sentiment_analysis.label === 'NEGATIVE' ? 'destructive' : 'secondary'
                            }>
                              {entry.sentiment_analysis.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mb-2 line-clamp-3">{entry.content}</p>
                        {entry.emotion_analysis && (
                          <div className="flex gap-1 flex-wrap">
                            {entry.emotion_analysis.slice(0, 3).map((emotion: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {emotion.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;