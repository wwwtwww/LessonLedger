import React, { createContext, useState, useContext, ReactNode } from 'react';

// 1. 国际化多语言字典库 (i18n)
const i18n = {
  'zh-CN': {
    title: '🎒 时课账本',
    subTitle: 'LessonLedger Pro',
    totalInvestment: '累计学费投入',
    activeProjects: '进行中项目',
    totalRemaining: '全家剩余总课时',
    switchLang: 'English',
    allMembers: '👥 全员总览',
    unitLesson: '课时',
    unitSession: '次',
    costPerLesson: '单次成本',
    schedule: '上课时间',
    alreadyUp: '已上',
    total: '总共',
    remain: '剩余',
    btnCheckIn: '✨ 一键打卡消课',
    btnCompleted: '已结课',
    noData: '暂无课程数据',
    noLog: '暂无打卡记录，上完课记得点上面打卡哦~',
    historyLog: '📝 历史打卡日志',
    confirmTitle: '确认打卡消课',
    confirmMsg: '确定要在今天为【{member}】的【{course}】打卡消课 1 次吗？',
    cancel: '取消',
    confirm: '确认',
    noRemainingError: '⚠️ 该项目已无剩余次数/课时！',
    addMember: '新增成员',
    addCourse: '录入新课程',
    editCourseTitle: '编辑课程',
    add: '添加',
    name: '姓名',
    icon: '图标(Emoji)',
    color: '主题色',
    courseName: '课程名称',
    cost: '总花费',
    totalHours: '总课时',
    bindMember: '绑定成员',
    nameRequired: '名称必填',
    memberRequired: '请选择成员',
    courseNamePlaceholder: '例如：钢琴、英语',
    schedulePlaceholder: '例如：周六 14:00',
    addMemberTitle: '新增成员',
    editMemberTitle: '编辑成员',
    save: '保存',
    nameLabel: '姓名',
    namePlaceholder: '输入成员姓名',
    iconLabel: '图标 (Emoji)',
    iconPlaceholder: '👤',
    themeColorLabel: '主题色',
    unitLabel: '单位类型'
  },
  'en-US': {
    title: '🎒 LessonLedger',
    subTitle: 'Lifelong Learning Tracker',
    totalInvestment: 'Total Investment',
    activeProjects: 'Active items',
    totalRemaining: 'Total Remaining',
    switchLang: '简体中文',
    allMembers: '👥 All Members',
    unitLesson: 'Lsn',
    unitSession: 'Ssn',
    costPerLesson: 'Per Cost',
    schedule: 'Schedule',
    alreadyUp: 'Done',
    total: 'Total',
    remain: 'Remains',
    btnCheckIn: '✨ Check-In',
    btnCompleted: 'Completed',
    noData: 'No Data Found',
    noLog: 'No records found. Tap Check-In to start!',
    historyLog: '📝 Audit Logs',
    confirmTitle: 'Confirm Check-In',
    confirmMsg: "Are you sure you want to Check-In 1 session for [{member}]'s [{course}]?",
    cancel: 'Cancel',
    confirm: 'Confirm',
    noRemainingError: '⚠️ No remaining sessions left!',
    addMember: 'Add Member',
    addCourse: 'Add Course',
    editCourseTitle: 'Edit Course',
    add: 'Add',
    name: 'Name',
    icon: 'Icon (Emoji)',
    color: 'Theme Color',
    courseName: 'Course Name',
    cost: 'Total Cost',
    totalHours: 'Total Hours',
    bindMember: 'Bind Member',
    nameRequired: 'Name is required',
    memberRequired: 'Please select a member',
    courseNamePlaceholder: 'e.g. Piano, English',
    schedulePlaceholder: 'e.g. Sat 14:00',
    addMemberTitle: 'Add Member',
    editMemberTitle: 'Edit Member',
    save: 'Save',
    nameLabel: 'Name',
    namePlaceholder: 'Enter member name',
    iconLabel: 'Icon (Emoji)',
    iconPlaceholder: '👤',
    themeColorLabel: 'Theme Color',
    unitLabel: 'Unit Type'
  }
};

export type Language = 'zh-CN' | 'en-US';

interface LanguageContextType {
  lang: Language;
  t: typeof i18n['zh-CN'];
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('zh-CN');
  const t = i18n[lang];

  const toggleLang = () => {
    setLang(prev => prev === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  return (
    <LanguageContext.Provider value={{ lang, t, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
