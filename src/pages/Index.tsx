import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Heart, BookOpen, BarChart3, Sparkles, Crown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRecentEntries();
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

  const fetchRecentEntries = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    setRecentEntries(data || []);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Brain className="h-16 w-16 text-primary" />
              <Heart className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Affectly
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your AI-powered mood journal and emotion tracker. Understand your emotions, 
              track your mental wellness, and discover patterns in your daily life.
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Smart Journaling</CardTitle>
                <CardDescription>
                  Write your thoughts and let AI analyze your emotions and mood patterns
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Visual Insights</CardTitle>
                <CardDescription>
                  Track your emotional journey with beautiful charts and personalized insights
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Crown className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Premium Features</CardTitle>
                <CardDescription>
                  Unlock unlimited entries, advanced emotions, and AI-generated insights
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Free Plan</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal">/month</span></div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    1 journal entry per day
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Basic sentiment analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Simple mood tracking
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Premium Plan</CardTitle>
                <CardDescription>For serious mood tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">$9.99<span className="text-sm font-normal">/month</span></div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Unlimited daily entries
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Advanced emotion analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Detailed mood insights
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Data export features
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name || user.email}!
          </h1>
          <p className="text-muted-foreground">
            How are you feeling today? Let's track your emotional journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Today's Journal
              </CardTitle>
              <CardDescription>
                Share your thoughts and feelings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/journal">
                <Button className="w-full">Write Entry</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                View Dashboard
              </CardTitle>
              <CardDescription>
                Analyze your mood patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">View Insights</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                {profile?.subscription_tier === 'premium' ? 'Premium Active' : 'Upgrade'}
              </CardTitle>
              <CardDescription>
                {profile?.subscription_tier === 'premium' 
                  ? 'Enjoy unlimited features'
                  : 'Unlock advanced features'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/settings">
                <Button variant={profile?.subscription_tier === 'premium' ? 'secondary' : 'default'} className="w-full">
                  {profile?.subscription_tier === 'premium' ? 'Manage Plan' : 'Upgrade Now'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {recentEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Journal Entries</CardTitle>
              <CardDescription>Your latest emotional insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                      {entry.sentiment_analysis && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {entry.sentiment_analysis.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">{entry.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
