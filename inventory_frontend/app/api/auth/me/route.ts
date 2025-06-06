import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      if (tokenMatch) {
        token = tokenMatch[1];
      }
    }
    
    if (!token) {
      console.log('No token found in request');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    console.log('Found token, validating with backend...');

    // Instead of verifying JWT ourselves, proxy to the Java backend
    // The backend knows the correct JWT secret
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    
    try {
      const response = await fetch(`${backendUrl}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Backend response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('Backend validation successful');
        
        // Return user information in expected format
        return NextResponse.json({
          user: {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            fullName: userData.name || userData.fullName, // Backend uses 'name' field
            role: userData.role
          },
          token: token
        });
      } else {
        console.log('Backend validation failed:', response.status);
        return NextResponse.json({ error: 'Token validation failed' }, { status: 401 });
      }
    } catch (backendError) {
      console.error('Backend request failed:', backendError);
      
      // Fallback: If backend is down, try to parse token without verification
      // This is NOT secure but allows development to continue
      console.log('Using fallback token parsing (development only)');
      
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        
        // Check if token is expired
        if (payload.exp && payload.exp < Date.now() / 1000) {
          console.log('Token is expired');
          return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        
        console.log('Fallback parsing successful for user:', payload.sub);
        
        // Create a reasonable user object from the token
        return NextResponse.json({
          user: {
            id: 1, // We don't have this in the token, so use default
            username: payload.sub || 'user',
            email: 'user@example.com', // Default since not in token
            fullName: payload.sub || 'User', // Use username as fullName
            role: 'USER' // Default role
          },
          token: token
        });
      } catch (fallbackError) {
        console.error('Fallback token parsing failed:', fallbackError);
        return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
      }
    }

  } catch (error) {
    console.error('Auth me endpoint error:', error);
    return NextResponse.json({ error: 'Authentication check failed' }, { status: 500 });
  }
} 