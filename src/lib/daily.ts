/**
 * Daily.co Video Integration
 *
 * Creates and manages video rooms for mentorship sessions.
 * Free tier: 2,000 minutes/month
 *
 * Required env var: DAILY_API_KEY
 */

const DAILY_API_URL = 'https://api.daily.co/v1';

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    exp?: number;
    nbf?: number;
    max_participants?: number;
    enable_chat?: boolean;
    enable_screenshare?: boolean;
    start_video_off?: boolean;
    start_audio_off?: boolean;
  };
}

interface CreateRoomOptions {
  /** Unique name for the room (e.g., session ID) */
  name: string;
  /** Room expiry time (Unix timestamp) - defaults to 24 hours after scheduled time */
  expiryTime?: number;
  /** Maximum participants - defaults to 2 for 1:1 mentoring */
  maxParticipants?: number;
}

/**
 * Get Daily.co API key from environment
 */
function getApiKey(): string | null {
  return process.env.DAILY_API_KEY || null;
}

/**
 * Create a new Daily.co room for a mentorship session
 */
export async function createDailyRoom(options: CreateRoomOptions): Promise<DailyRoom | null> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn('DAILY_API_KEY not configured - video rooms disabled');
    return null;
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: options.name,
        privacy: 'private', // Requires meeting token to join
        properties: {
          exp: options.expiryTime || Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours default
          max_participants: options.maxParticipants || 2,
          enable_chat: true,
          enable_screenshare: true,
          enable_knocking: false, // Don't require host to admit
          start_video_off: false,
          start_audio_off: false,
          eject_at_room_exp: true, // Kick users when room expires
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to create Daily room:', error);
      return null;
    }

    const room = await response.json();
    console.log(`Daily room created: ${room.url}`);
    return room;
  } catch (error) {
    console.error('Error creating Daily room:', error);
    return null;
  }
}

/**
 * Delete a Daily.co room
 */
export async function deleteDailyRoom(roomName: string): Promise<boolean> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return false;
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting Daily room:', error);
    return false;
  }
}

/**
 * Create a meeting token for a participant
 * Tokens allow access to private rooms with custom properties
 */
export async function createMeetingToken(options: {
  roomName: string;
  userName: string;
  isOwner?: boolean;
  expiryTime?: number;
}): Promise<string | null> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: options.roomName,
          user_name: options.userName,
          is_owner: options.isOwner || false,
          exp: options.expiryTime || Math.floor(Date.now() / 1000) + (2 * 60 * 60), // 2 hours default
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to create meeting token:', error);
      return null;
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error creating meeting token:', error);
    return null;
  }
}

/**
 * Get room details
 */
export async function getDailyRoom(roomName: string): Promise<DailyRoom | null> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Daily room:', error);
    return null;
  }
}

/**
 * Generate a unique room name from session ID
 */
export function generateRoomName(sessionId: string): string {
  return `mentor-session-${sessionId}`;
}
