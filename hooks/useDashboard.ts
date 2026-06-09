import { useMemo } from 'react';
import { useMembers } from './useMembers';
import { useClasses } from './useClasses';
import { COLORS } from '../utils/colors';

export function useDashboard() {
  const memberHook = useMembers();
  const { members, currentMemberId } = memberHook;

  // 修正参数传递：确保 useClasses 接收到最新的成员列表和当前选中成员 ID
  const classHook = useClasses(currentMemberId, members);
  const { filteredClasses } = classHook;

  const dashboardStats = useMemo(() => {
    // 复用逻辑：直接基于已经处理过 isDeleted 和 currentMemberId 过滤的 filteredClasses 进行计算
    const totalRemaining = filteredClasses.reduce((acc, curr) => acc + (curr.totalLessons - curr.doneLessons), 0);
    const totalSpent = filteredClasses.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const totalClasses = filteredClasses.length;
    const warningCount = filteredClasses.filter(c => (c.totalLessons - c.doneLessons) <= 3).length;
    
    // 计算本周待上：统计所有进行中课程的 schedule 条目数
    const upcomingThisWeek = filteredClasses.reduce((acc, curr) => acc + (curr.schedule?.length || 0), 0);

    const activeMember = members.find(m => m.id === currentMemberId) || null;
    const themeColor = activeMember?.themeColor || COLORS.primary;

    return {
      totalRemaining,
      totalSpent,
      totalClasses,
      warningCount,
      upcomingThisWeek,
      activeMember,
      themeColor
    };
  }, [filteredClasses, members, currentMemberId]);

  // 聚合职责：将底层 Hook 的状态和动作统一导出，保持简洁并避免重复逻辑
  return {
    ...memberHook,
    ...classHook,
    stats: {
      totalRemaining: dashboardStats.totalRemaining,
      totalSpent: dashboardStats.totalSpent,
      totalClasses: dashboardStats.totalClasses,
      warningCount: dashboardStats.warningCount,
      upcomingThisWeek: dashboardStats.upcomingThisWeek
    },
    activeMember: dashboardStats.activeMember,
    themeColor: dashboardStats.themeColor,
    classes: filteredClasses, // 覆盖原始 classes，导出过滤后的结果
    isLoading: memberHook.isLoading || classHook.isLoading
  };
}

