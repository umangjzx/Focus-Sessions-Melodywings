import axios from 'axios';
import {
  meetingsApi,
  type Meeting,
  type MeetingParticipant,
  type MeetingSync,
  type MeetingSummary,
} from './api';

export type { Meeting, MeetingParticipant, MeetingSync, MeetingSummary };

function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { detail?: string })?.detail || fallback;
  }
  return fallback;
}

export async function createMeeting(title: string) {
  const { data } = await meetingsApi.create(title);
  return data;
}

export async function getLatestAvailable(): Promise<Meeting | null> {
  try {
    const { data } = await meetingsApi.getLatestAvailable();
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function joinLatestMeeting() {
  try {
    const { data } = await meetingsApi.joinLatest();
    return data;
  } catch (err) {
    throw new Error(getErrorMessage(err, 'No active focus rooms available.'));
  }
}

export async function joinMeeting(roomCode: string) {
  try {
    const { data } = await meetingsApi.join(roomCode);
    return data;
  } catch (err) {
    throw new Error(getErrorMessage(err, 'Could not join that room.'));
  }
}

export async function getMeeting(roomCode: string): Promise<Meeting> {
  const { data } = await meetingsApi.get(roomCode);
  return data;
}

export async function getMeetingState(roomCode: string): Promise<MeetingSync> {
  const { data } = await meetingsApi.getState(roomCode);
  return data;
}

export async function getMeetingSummary(roomCode: string): Promise<MeetingSummary> {
  const { data } = await meetingsApi.getSummary(roomCode);
  return data;
}

export async function getParticipants(roomCode: string): Promise<MeetingParticipant[]> {
  const { data } = await meetingsApi.getParticipants(roomCode);
  return data;
}

export function normalizeMeetingStatus(status: string): string {
  return (status || 'WAITING').toUpperCase();
}
