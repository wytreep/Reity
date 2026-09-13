export type GoalStatus = 'active' | 'completed' | 'cancelled';

export class Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  status: GoalStatus;
  createdAt: Date;
}
