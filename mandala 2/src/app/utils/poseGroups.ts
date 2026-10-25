// utils/poseGroups.ts
import { PoseDataItem } from '../types/yoga.types';
import { POSE_CATEGORIES, isRealPose } from '../constants/yoga.constants';

export interface PoseGroup {
  name: string;
  items: { pose: PoseDataItem; index: number }[];
}

/** Poses sorted into their kinds (Standing, Seated...), keeping each pose's index in the list */
export function groupPoses(posesData: PoseDataItem[]): PoseGroup[] {
  const indexed = posesData.map((pose, index) => ({ pose, index })).filter(({ pose }) => isRealPose(pose.name));
  const out: PoseGroup[] = POSE_CATEGORIES.filter(c => c.poses).map(c => ({
    name: c.name,
    items: indexed.filter(({ pose }) => c.poses!.includes(pose.name)),
  }));
  const listed = new Set(POSE_CATEGORIES.flatMap(c => c.poses ?? []));
  const rest = indexed.filter(({ pose }) => !listed.has(pose.name));
  if (rest.length) out.push({ name: 'More poses', items: rest });
  return out.filter(g => g.items.length);
}

// each kind of pose gets its own tile colour, like a sheet of stickers
export const GROUP_TILES = ['bg-lilac-soft', 'bg-rose-soft', 'bg-sun-soft', 'bg-leaf-soft', 'bg-peach-soft', 'bg-paper'];
export const GROUP_DOTS = ['bg-lilac', 'bg-rose', 'bg-sun', 'bg-leaf', 'bg-peach', 'bg-hill'];
