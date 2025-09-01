import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Crown, User, CreditCard, Bell, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
    
    // Check for payment success/failure from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');
    
    if (paymentStatus === 'success' && reference) {
      verifyPayment(reference);
    }
  }, [user]);

  const verifyPayment = async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { reference }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Payment verification failed');
      }

      toast({
        title: "Payment Successful!",
        description: "Your subscription has been upgraded to Premium.",
      });

      // Refresh profile to show updated subscription
      fetchProfile();
      
      // Clean URL
      window.history.replaceState({}, document.title, '/settings');
      
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Payment Verification Failed",
        description: "Please contact support if payment was deducted.",
        variant: "destructive",
      });
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user?.email) return;

    try {
      setIsUpgrading(true);
      
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          email: user.email,
          amount: 600, // 600 KES
          callback_url: `${window.location.origin}/settings?payment=success`
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Payment initialization failed');
      }

      // Redirect to Paystack payment page
      window.location.href = data.data.authorization_url;
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = () => {
    toast({
      title: "Subscription Management",
      description: "Contact support to manage your subscription.",
    });
  };

  const isPremium = profile?.subscription_tier === 'premium';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account, subscription, and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={updateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize your Affectly experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Daily Reminders</h4>
                      <p className="text-sm text-muted-foreground">
                        Get reminded to write in your journal
                      </p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly mood insights via email
                      </p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Dark Mode</h4>
                      <p className="text-sm text-muted-foreground">
                        Toggle between light and dark themes
                      </p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Manage your data and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Data Export</h4>
                      <p className="text-sm text-muted-foreground">
                        Download all your journal data
                      </p>
                    </div>
                    {isPremium ? (
                      <Button variant="outline" size="sm">
                        Export Data
                      </Button>
                    ) : (
                      <Badge variant="secondary">Premium Only</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Subscription
                </CardTitle>
                <CardDescription>
                  Manage your subscription plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {isPremium && <Crown className="h-5 w-5 text-primary" />}
                      <Badge variant={isPremium ? "default" : "secondary"}>
                        {isPremium ? "Premium" : "Free"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isPremium 
                        ? "You have access to all premium features"
                        : "Upgrade to unlock unlimited entries and advanced features"
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Current Plan Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {isPremium ? "Unlimited" : "5"} journal entries per day</li>
                      <li>• {isPremium ? "Advanced" : "Basic"} sentiment analysis</li>
                      {isPremium && (
                        <>
                          <li>• Multi-emotion detection</li>
                          <li>• Detailed mood insights</li>
                          <li>• Data export features</li>
                          <li>• AI-generated insights</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {isPremium ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleManageSubscription}
                    >
                      Manage Subscription
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold">KES 600</div>
                        <div className="text-sm text-muted-foreground">per month</div>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={handleUpgrade}
                        disabled={isUpgrading}
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        {isUpgrading ? "Processing..." : "Upgrade to Premium"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since:</span>
                    <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="capitalize">{profile?.subscription_tier || 'Free'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="font-mono text-xs">{user?.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;