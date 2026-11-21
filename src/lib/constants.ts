import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export const MOODS: { value: MoodValue; label: string; icon: IconName; color: string }[] = [
  { value: 1, label: 'Heavy', icon: 'emoticon-cry-outline', color: '#7D8BB0' },
  { value: 2, label: 'Low', icon: 'emoticon-sad-outline', color: '#9BAFC4' },
  { value: 3, label: 'Okay', icon: 'emoticon-neutral-outline', color: '#C7B593' },
  { value: 4, label: 'Good', icon: 'emoticon-happy-outline', color: '#E2A065' },
  { value: 5, label: 'Bright', icon: 'emoticon-excited-outline', color: '#DB7458' },
];

export const moodInfo = (value: number) => MOODS[Math.min(Math.max(value, 1), 5) - 1];

export const FEELINGS = [
  'Calm', 'Grateful', 'Hopeful', 'Proud', 'Loved', 'Motivated', 'Content', 'Excited',
  'Tired', 'Anxious', 'Stressed', 'Lonely', 'Frustrated', 'Bored', 'Overwhelmed', 'Sad',
];

export const ACTIVITIES = [
  'Work', 'School', 'Family', 'Friends', 'Partner', 'Exercise', 'Rest', 'Faith',
  'Music', 'Outdoors', 'Reading', 'Gaming', 'Cooking', 'Creating', 'Travel', 'Screen time',
];

export const PROMPTS = [
  'What took most of your energy today?',
  'What is one small thing that went well?',
  'Who did you think about today, and why?',
  'What would you tell yourself from this morning?',
  'What are you avoiding right now?',
  'When did you feel most like yourself today?',
  'What are you grateful for tonight?',
  'What drained you, and what filled you back up?',
  'What did you learn about yourself today?',
  'What is on your mind that you have not said out loud?',
  'What do you want tomorrow to feel like?',
  'What made you smile, even a little?',
];

export const GOALS = [
  'Understand my moods',
  'Build a writing habit',
  'Reduce stress',
  'Practise gratitude',
  'Track my growth',
  'Just have a private space',
];

export const ACCENTS = [
  { key: 'clay', label: 'Clay', color: '#C2654A' },
  { key: 'sage', label: 'Sage', color: '#5F8A68' },
  { key: 'ocean', label: 'Ocean', color: '#3F72A0' },
  { key: 'plum', label: 'Plum', color: '#8A5683' },
  { key: 'amber', label: 'Amber', color: '#C08A2E' },
] as const;

export type AccentKey = (typeof ACCENTS)[number]['key'];
