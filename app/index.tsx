import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import AddMemberModal from '../components/AddMemberModal';
import AddClassModal from '../components/AddClassModal';

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
    name: '姓名',
    icon: '图标(Emoji)',
    color: '主题色',
    courseName: '课程名称',
    cost: '总花费',
    totalHours: '总课时',
    bindMember: '绑定成员'
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
    name: 'Name',
    icon: 'Icon (Emoji)',
    color: 'Theme Color',
    courseName: 'Course Name',
    cost: 'Total Cost',
    totalHours: 'Total Hours',
    bindMember: 'Bind Member'
  }
};

interface Member {
  id: string;
  name: string;
  icon: string;
  themeColor: string;
}

interface ClassItem {
  id: string;
  memberId: string;
  name: string;
  totalPrice: number;
  totalLessons: number;
  doneLessons: number;
  schedule: string;
  unitType: 'lesson' | 'session';
}

interface LogItem {
  id: string;
  time: string;
  text: string;
}

export default function App() {
  // 语言状态管理
  const [lang, setLang] = useState<'zh-CN' | 'en-US'>('zh-CN');
  const t = i18n[lang];

  // 成员状态管理（支持儿童与成人）
  const [members, setMembers] = useState<Member[]>([
    { id: 'm1', name: lang === 'zh-CN' ? '哥哥' : 'Brother', icon: '👦', themeColor: '#3B82F6' },
    { id: 'm2', name: lang === 'zh-CN' ? '妹妹' : 'Sister', icon: '👧', themeColor: '#EC4899' },
    { id: 'm3', name: lang === 'zh-CN' ? '妈妈' : 'Mom', icon: '🏋️', themeColor: '#10B981' },
  ]);
  const [currentMemberId, setCurrentMemberId] = useState<string>('all');

  const [isAddMemberVisible, setIsAddMemberVisible] = useState(false);
  const [isAddClassVisible, setIsAddClassVisible] = useState(false);

  const handleAddMember = (name: string, icon: string, themeColor: string) => {
    setMembers([...members, { id: 'm' + Date.now(), name, icon, themeColor }]);
    setIsAddMemberVisible(false);
  };

  const handleAddClass = (classItem: { name: string; memberId: string; totalPrice: number; totalLessons: number; schedule: string }) => {
    setClasses([...classes, {
      ...classItem,
      id: 'c' + Date.now(),
      doneLessons: 0,
      unitType: 'lesson'
    }]);
    setIsAddClassVisible(false);
  };

  // 核心课程数据
  const [classes, setClasses] = useState<ClassItem[]>([
    { id: 'c1', memberId: 'm1', name: lang === 'zh-CN' ? '钢琴' : 'Piano', totalPrice: 5000, totalLessons: 22, doneLessons: 10, schedule: '周一晚 18:00', unitType: 'lesson' },
    { id: 'c2', memberId: 'm2', name: lang === 'zh-CN' ? '美术' : 'Art', totalPrice: 2000, totalLessons: 20, doneLessons: 3, schedule: '周三六 14:00', unitType: 'lesson' },
    { id: 'c3', memberId: 'm3', name: lang === 'zh-CN' ? '私教健身' : 'Fitness Gym', totalPrice: 3000, totalLessons: 10, doneLessons: 8, schedule: '周五晚 19:30', unitType: 'session' },
  ]);

  const [logs, setLogs] = useState<LogItem[]>([]);

  // 动态全局资产聚合计算
  const totalSpent = classes.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalClasses = classes.length;
  const totalRemaining = classes.reduce((sum, item) => sum + (item.totalLessons - item.doneLessons), 0);

  // 过滤当前选中的成员项目
  const filteredClasses = currentMemberId === 'all' 
    ? classes 
    : classes.filter(c => c.memberId === currentMemberId);

  // 一键对账打卡消课系统
  const handleCheckIn = (classId: string, className: string, memberName: string) => {
    const performAction = () => {
      setClasses(prevClasses => 
        prevClasses.map(item => {
          if (item.id === classId) {
            if (item.doneLessons >= item.totalLessons) {
              if (Platform.OS === 'web') alert(t.noRemainingError);
              else Alert.alert('', t.noRemainingError);
              return item;
            }

            // 生成带精确时间的不可篡改凭证日志
            const now = new Date();
            const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const logMessage = `[${memberName}] ${className} -> -1 ${item.unitType === 'lesson' ? t.unitLesson : t.unitSession}`;
            
            setLogs(prevLogs => [{ id: Date.now().toString(), time: timeStr, text: logMessage }, ...prevLogs]);
            return { ...item, doneLessons: item.doneLessons + 1 };
          }
          return item;
        })
      );
    };

    // 防误触双重确认
    const msg = t.confirmMsg.replace('{member}', memberName).replace('{course}', className);
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) performAction();
    } else {
      Alert.alert(t.confirmTitle, msg, [
        { text: t.cancel, style: 'cancel' },
        { text: t.confirm, onPress: performAction }
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 顶部多语言一键切换栏 */}
      <View style={styles.langHeader}>
        <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === 'zh-CN' ? 'en-US' : 'zh-CN')}>
          <Text style={styles.langBtnText}>🌐 {t.switchLang}</Text>
        </TouchableOpacity>
      </View>

      {/* 标题 */}
      <Text style={styles.appTitle}>{t.title}</Text>
      <Text style={styles.appSubTitle}>{t.subTitle}</Text>

      {/* 2. 多成员全资产大局看板 */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{lang === 'zh-CN' ? '￥' : '$'}{totalSpent}</Text>
          <Text style={styles.summaryLabel}>{t.totalInvestment}</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryBorder]}>
          <Text style={styles.summaryNum}>{totalClasses}</Text>
          <Text style={styles.summaryLabel}>{t.activeProjects}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{totalRemaining}</Text>
          <Text style={styles.summaryLabel}>{t.totalRemaining}</Text>
        </View>
      </View>

      {/* 3. 全人群成员切换沙盒 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberSelectorRow}>
        <TouchableOpacity 
          style={[styles.memberTab, currentMemberId === 'all' && styles.memberTabActiveAll]} 
          onPress={() => setCurrentMemberId('all')}
        >
          <Text style={[styles.memberTabText, currentMemberId === 'all' && styles.memberTabTextActive]}>{t.allMembers}</Text>
        </TouchableOpacity>
        {members.map(m => {
          const isSelected = currentMemberId === m.id;
          return (
            <TouchableOpacity 
              key={m.id} 
              style={[styles.memberTab, isSelected && { backgroundColor: m.themeColor, borderColor: 'transparent' }]} 
              onPress={() => setCurrentMemberId(m.id)}
            >
              <Text style={[styles.memberTabText, isSelected && styles.memberTabTextActive]}>{m.icon} {m.name}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity 
          style={[styles.memberTab, styles.addMemberTab]} 
          onPress={() => setIsAddMemberVisible(true)}
        >
          <Text style={styles.addMemberTabText}>+ {t.addMember}</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.addCourseBtn} onPress={() => setIsAddClassVisible(true)}>
        <Text style={styles.addCourseBtnText}>+ {t.addCourse}</Text>
      </TouchableOpacity>

      {/* 4. 智能动态项目卡片流 */}
      <View style={styles.listSection}>
        {filteredClasses.length === 0 ? (
          <Text style={styles.emptyText}>{t.noData}</Text>
        ) : (
          filteredClasses.map(item => {
            const owner = members.find(m => m.id === item.memberId);
            const remaining = item.totalLessons - item.doneLessons;
            const progress = (item.doneLessons / item.totalLessons) * 100;
            const costPerUnit = (item.totalPrice / item.totalLessons).toFixed(1);
            const unitLabel = item.unitType === 'lesson' ? t.unitLesson : t.unitSession;

            // 低余额红灯预警判定 (剩余 <= 3 亮猩红灯)
            const isWarning = remaining <= 3 && remaining > 0;
            const isDone = remaining === 0;

            return (
              <View key={item.id} style={[styles.classCard, isWarning && styles.classCardWarning]}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleGroup}>
                    <Text style={styles.className}>{item.name}</Text>
                    <Text style={[styles.memberBadge, { backgroundColor: owner?.themeColor + '20', color: owner?.themeColor }]}>
                      {owner?.icon} {owner?.name}
                    </Text>
                  </View>
                  <Text style={styles.classCost}>{lang === 'zh-CN' ? '￥' : '$'}{costPerUnit} / {unitLabel}</Text>
                </View>

                <Text style={styles.classTime}>🕒 {t.schedule}: {item.schedule}</Text>

                <View style={styles.lessonInfoRow}>
                  <Text style={styles.lessonText}>
                    {t.alreadyUp} <Text style={styles.boldText}>{item.doneLessons}</Text> / {t.total} {item.totalLessons}
                  </Text>
                  <Text style={styles.lessonText}>
                    {t.remain} <Text style={[styles.boldText, isWarning && styles.warningText]}>{remaining}</Text> {unitLabel}
                  </Text>
                </View>

                {/* 进度条 */}
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress}%` }, isWarning && { backgroundColor: '#EF4444' }]} />
                </View>

                {/* 打卡按钮 */}
                <TouchableOpacity 
                  style={[styles.checkInBtn, { backgroundColor: owner?.themeColor }, isDone && styles.disabledBtn]} 
                  onPress={() => handleCheckIn(item.id, item.name, owner?.name || '')}
                  disabled={isDone}
                >
                  <Text style={styles.checkInBtnText}>{isDone ? t.btnCompleted : t.btnCheckIn}</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      {/* 5. 年月日精密对账日志区 */}
      <Text style={styles.sectionTitle}>{t.historyLog}</Text>
      <View style={styles.logContainer}>
        {logs.length === 0 ? (
          <Text style={styles.emptyLogText}>{t.noLog}</Text>
        ) : (
          logs.map(log => (
            <View key={log.id} style={styles.logTextRow}>
              <Text style={styles.logTime}>{log.time}</Text>
              <Text style={styles.logText}>✅ {log.text}</Text>
            </View>
          ))
        )}
      </View>

      <AddMemberModal
        visible={isAddMemberVisible}
        onClose={() => setIsAddMemberVisible(false)}
        onAdd={handleAddMember}
        t={t}
      />
      <AddClassModal
        visible={isAddClassVisible}
        onClose={() => setIsAddClassVisible(false)}
        onAdd={handleAddClass}
        members={members}
        t={t}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { 
    padding: 20, 
    paddingBottom: 50,
    maxWidth: 600,             
    width: '100%',             
    marginHorizontal: 'auto'   
  },
  langHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 5 },
  langBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  langBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  appTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginTop: 5 },
  appSubTitle: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  summaryCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  summaryNum: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  summaryLabel: { fontSize: 11, color: '#94A3B8' },
  memberSelectorRow: { flexDirection: 'row', marginBottom: 15, paddingBottom: 5 },
  memberTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8, height: 38 },
  memberTabActiveAll: { backgroundColor: '#0F172A', borderColor: 'transparent' },
  memberTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  memberTabTextActive: { color: '#FFFFFF' },
  addMemberTab: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  addMemberTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  addCourseBtn: { backgroundColor: '#0F172A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  addCourseBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  listSection: { marginBottom: 20 },
  classCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  classCardWarning: { borderColor: '#EF4444', shadowColor: '#EF4444', shadowOpacity: 0.08 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  className: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  memberBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  classCost: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  classTime: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  lessonInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  lessonText: { fontSize: 13, color: '#475569' },
  boldText: { fontWeight: 'bold', color: '#0F172A' },
  warningText: { color: '#EF4444', fontWeight: '900' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginBottom: 14, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },
  checkInBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#CBD5E1' },
  checkInBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#334155', marginBottom: 10 },
  logContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { textAlign: 'center', color: '#94A3B8', padding: 20 },
  emptyLogText: { color: '#94A3B8', textAlign: 'center', fontSize: 12, paddingVertical: 10 },
  logTextRow: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between' },
  logTime: { fontSize: 11, color: '#94A3B8', width: 110 },
  logText: { fontSize: 13, fontWeight: '600', color: '#334155', flex: 1 }
});