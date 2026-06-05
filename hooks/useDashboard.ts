import { useMemo } from 'react';
import { useMembers } from './useMembers';
import { useClasses } from './useClasses';

export function useDashboard() {
  const { members, currentMemberId, setCurrentMemberId } = useMembers();
  const { classes } = useClasses();

  const dashboardData = useMemo(() => {
    const filteredClasses = currentMemberId === 'all' 
      ? classes 
      : classes.filter(c => c.memberId === currentMemberId);

    // 计算统计数据
    const totalRemaining = filteredClasses.reduce((acc, curr) => acc + (curr.totalLessons - curr.doneLessons), 0);
    const warningCount = filteredClasses.filter(c => (c.totalLessons - c.doneLessons) <= 3).length;

    return {
      classes: filteredClasses,
      totalRemaining,
      warningCount,
      activeMember: members.find(m => m.id === currentMemberId) || null
    };
  }, [classes, members, currentMemberId]);

  return {
    ...dashboardData,
    members,
    currentMemberId,
    setCurrentMemberId
  };
}
