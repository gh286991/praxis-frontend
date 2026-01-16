'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'; // Assuming you have shadcn UI button
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Since we don't have a specific /me endpoint yet in the plan,
    // we decode the token if it has info or better -> we should add a /profile endpoint in User controller or Auth controller.
    // Wait, the plan said: "Verify user data (name, email, picture) is displayed."
    // And "Fetch data from backend using the JWT token."
    // I missed adding a specific endpoint for fetching user profile in the backend implementation!
    // I should fix that. For now, I'll attempt to fetch from a hypothetically existing endpoint or just decode if I put data in JWT.
    // The login payload was: { email: user.email, sub: user._id }
    // It doesn't have name or picture. So I MUST fetch it.
    // I will assume specific endpoint exists or I will add it.
    // Let's call /users/profile (I need to implement this in UsersController).
    
    // For now, I will implement the fetch logic hoping I add the endpoint in the next step.
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem('jwt_token');
        router.push('/login');
      });
  }, [router]);

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.name}</CardTitle>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </CardHeader>
        <CardContent>
           <Button 
            variant="destructive" 
            onClick={() => {
              localStorage.removeItem('jwt_token');
              router.push('/login');
            }}
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
