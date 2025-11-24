import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('🎙️ Conversation token endpoint called');
    const body = await request.json().catch(() => ({} as any));
    console.log('📦 Request body:', JSON.stringify(body));
    const agentId = body?.agentId || body?.agent_id;
    
    if (!agentId) {
      console.error('❌ No agent ID provided in request body');
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Check if this is a free demo session (from request body)
    const isFreeDemo = body?.is_free_demo === true
    
    // Check if user has active trial or subscription
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Allow anonymous users for free demo
    if ((authError || !user) && !isFreeDemo) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // If anonymous free demo, allow it
    if (isFreeDemo && !user) {
      console.log('✅ Allowing anonymous free demo conversation token')
      // Continue to create token
    } else if (user) {
      // Check subscription for authenticated users
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_status, trial_ends_at, used_free_demo')
        .eq('id', user.id)
        .single()

      const status = userData?.subscription_status || null
      const trialEndsAt = userData?.trial_ends_at || null
      const now = Date.now()
      const trialEndMs = trialEndsAt ? new Date(trialEndsAt).getTime() : null
      const isTrialing = status === 'trialing' && trialEndMs !== null && trialEndMs > now
      const hasActiveSubscription = status === 'active' || isTrialing
      const usedFreeDemo = userData?.used_free_demo || false

      // Allow free demo for authenticated users without subscription
      if (!hasActiveSubscription && !usedFreeDemo && isFreeDemo) {
        console.log('✅ Allowing authenticated free demo conversation token')
        // Continue to create token
      } else if (!hasActiveSubscription && !isFreeDemo) {
        return NextResponse.json(
          { 
            error: 'Free trial required',
            details: 'Please start a free trial to use agents. Visit /pricing to get started.',
            requiresTrial: true
          },
          { status: 403 }
        );
      }
    }

    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    console.log('🔑 API Key exists:', !!apiKey);
    console.log('🔑 API Key first 10 chars:', apiKey?.substring(0, 10) + '...');
    
    if (!apiKey) {
      console.error('❌ ELEVEN_LABS_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('🎙️ Requesting WebRTC conversation token for agent:', agentId);

    // Get conversation token for WebRTC connection
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`;
    console.log('📡 Requesting token from ElevenLabs:', elevenLabsUrl);
    
    const response = await fetch(elevenLabsUrl, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('📨 ElevenLabs Token Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        agentId,
      });

      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'Agent not found',
            details: `Agent with ID ${agentId} does not exist or you don't have access to it.`,
            statusCode: 404,
            agentId
          },
          { status: 404 }
        );
      }

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { 
            error: 'Authentication failed',
            details: 'API key is invalid or does not have access to this agent.',
            statusCode: response.status
          },
          { status: response.status }
        );
      }

      return NextResponse.json(
        { 
          error: `ElevenLabs API error: ${response.status}`,
          details: errorText || response.statusText,
          statusCode: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📦 ElevenLabs response data:', JSON.stringify(data));
    console.log('✅ Successfully obtained conversation token');
    
    // ElevenLabs returns "token" not "conversation_token"
    const token = data.token || data.conversation_token;
    console.log('🎟️ Token exists:', !!token);
    
    return NextResponse.json({
      conversation_token: token,
      expires_at: data.expires_at,
      agentId,
    });
    
  } catch (error: any) {
    console.error('❌ Error in conversation token endpoint:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Failed to get conversation token'
      },
      { status: 500 }
    );
  }
}

