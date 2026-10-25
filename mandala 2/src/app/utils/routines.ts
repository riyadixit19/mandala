// utils/routines.ts
// Ready-made routines, plus routines a child or grown-up makes and keeps on this device.
//
// The ready-made ones follow common kids' yoga sequences: a simple sun salutation, animal poses,
// standing "strong" poses, balance, a short calm-down and a bedtime wind-down that ends lying still.
// None of them use poses that load or bend the neck hard (headstand, shoulder stand, plow, fish...),
// because children with Down syndrome have a higher risk of neck instability (atlantoaxial instability).

export type RoutineColor = 'leaf' | 'lilac' | 'rose' | 'peach' | 'sun';

export interface Routine {
  id: string;
  name: string;
  blurb: string;
  poses: string[];
  color: RoutineColor;
  custom?: boolean;
}

export const ROUTINES: Routine[] = [
  {
    id: 'sunny-morning',
    name: 'Sunny Morning',
    blurb: 'Say hello to the sun and wake up your whole body.',
    poses: ['Mountain Pose', 'Standing Forward Bend', 'Plank Pose', 'Cobra Pose', 'Downward Dog', 'Mountain Pose'],
    color: 'sun',
  },
  {
    id: 'animal-friends',
    name: 'Animal Friends',
    blurb: 'Be a cat, a cow, a dog, a snake and a bug.',
    poses: ['Cat Pose', 'Cow Pose', 'Downward Dog', 'Cobra Pose', 'Locust Pose'],
    color: 'rose',
  },
  {
    id: 'strong-legs',
    name: 'Strong Like a Warrior',
    blurb: 'Stand tall and make your legs strong.',
    poses: ['Mountain Pose', 'Chair Pose', 'Warrior II', 'Triangle Pose', 'Warrior I'],
    color: 'peach',
  },
  {
    id: 'balance-buddies',
    name: 'Balance Buddies',
    blurb: 'Wobbly is fine! A wall or a chair can help.',
    poses: ['Mountain Pose', 'Tree Pose', 'Chair Pose', 'Warrior III', 'Mountain Pose'],
    color: 'leaf',
  },
  {
    id: 'calm-down',
    name: 'Quick Calm Down',
    blurb: 'Four slow poses for when you need a break.',
    poses: ['Mountain Pose', 'Standing Forward Bend', "Child's Pose", 'Easy Pose'],
    color: 'lilac',
  },
  {
    id: 'sleepy-time',
    name: 'Sleepy Time',
    blurb: 'Slow down and get ready for bed.',
    poses: ['Easy Pose', 'Bound Angle Pose', 'Seated Forward Bend', 'Happy Baby Pose', "Child's Pose", 'Corpse Pose'],
    color: 'lilac',
  },
];

/** Poses that put weight on, or bend, the neck. Check with a doctor before trying these. */
export const NECK_CAUTION = ['Headstand', 'Shoulder Stand', 'Plow Pose', 'Fish Pose', 'Forearm Stand', 'Handstand', 'Scorpion Pose'];

/** Rough length: about 25 seconds a pose (check, hold and moving between poses) */
export const minutesFor = (r: Routine) => Math.max(1, Math.round((r.poses.length * 25) / 60));

const KEY = 'mandala-routines';
// used when storage is blocked (private windows, some embedded browsers)
let memory: Routine[] = [];

export function readCustomRoutines(): Routine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return memory;
}

function writeCustomRoutines(list: Routine[]) {
  memory = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function saveCustomRoutine(name: string, poses: string[]): Routine {
  const colors: RoutineColor[] = ['rose', 'lilac', 'peach', 'leaf', 'sun'];
  const list = readCustomRoutines();
  const routine: Routine = {
    id: `my-${Date.now().toString(36)}`,
    name: name.trim() || 'My routine',
    blurb: `${poses.length} poses I picked.`,
    poses,
    color: colors[list.length % colors.length],
    custom: true,
  };
  writeCustomRoutines([...list, routine]);
  return routine;
}

export function deleteCustomRoutine(id: string) {
  writeCustomRoutines(readCustomRoutines().filter(r => r.id !== id));
}

export function findRoutine(id: string): Routine | undefined {
  return ROUTINES.find(r => r.id === id) ?? readCustomRoutines().find(r => r.id === id);
}
