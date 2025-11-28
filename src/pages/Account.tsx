import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Account = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success('Signed out successfully');
            navigate('/');
        } catch (error) {
            toast.error('Error signing out');
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-black text-white pt-32 px-4">
            <div className="max-w-2xl mx-auto">
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">My Account</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20 border-2 border-red-600">
                                <AvatarImage src={user.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-zinc-800 text-xl font-bold">
                                    {user.email?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-xl font-semibold">{user.user_metadata?.full_name || 'User'}</h3>
                                <p className="text-zinc-400">{user.email}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-black/50 rounded-lg border border-zinc-800">
                                    <p className="text-sm text-zinc-500 mb-1">User ID</p>
                                    <p className="font-mono text-sm truncate">{user.id}</p>
                                </div>
                                <div className="p-4 bg-black/50 rounded-lg border border-zinc-800">
                                    <p className="text-sm text-zinc-500 mb-1">Last Sign In</p>
                                    <p className="font-mono text-sm">
                                        {new Date(user.last_sign_in_at || '').toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-800">
                                <Button
                                    variant="destructive"
                                    onClick={handleSignOut}
                                    className="w-full sm:w-auto"
                                >
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Account;
