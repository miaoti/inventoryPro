import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function GET(request: NextRequest) {
  console.log('=== Quick Actions API Route GET Request ===');
  
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    console.log('Token found:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Target URL:', `${API_BASE_URL}/user/quick-actions`);
    
    if (!token) {
      console.log('No token found - returning 401');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    console.log('Request headers:', headers);

    console.log('Making fetch request...');
    const response = await fetch(`${API_BASE_URL}/user/quick-actions`, {
      method: 'GET',
      headers,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      console.log('Response not ok, returning error with status:', response.status);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('Successful response, returning data');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in quick-actions route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('=== Quick Actions API Route POST Request ===');
  
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    console.log('Token found:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      console.log('No token found - returning 401');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    console.log('Request headers:', headers);

    console.log('Making fetch request...');
    const response = await fetch(`${API_BASE_URL}/user/quick-actions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      console.log('Response not ok, returning error with status:', response.status);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('Successful response, returning data');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in quick-actions POST route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 