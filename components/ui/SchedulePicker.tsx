import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { ScheduleEntry } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatSchedule } from '../../utils/formatters';

const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SchedulePicker({ value, onChange }: { value: ScheduleEntry[], onChange: (v: ScheduleEntry[]) => void }) {
  const { lang, t } = useLanguage();
  const daysMap = lang === 'zh-CN' ? DAYS_ZH : DAYS_EN;
  
  const [mode, setMode] = useState<'weekly' | 'specific'>('weekly');
  const [selectedDay, setSelectedDay] = useState(1); // Default Mon
  const [timeStr, setTimeStr] = useState('18:00');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);

  const handleAdd = () => {
    if (!timeStr.trim()) return;
    const newEntry: ScheduleEntry = {
      type: mode,
      time: timeStr.trim(),
    };
    if (mode === 'weekly') newEntry.day = selectedDay;
    else newEntry.date = dateStr.trim();

    onChange([...value, newEntry]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {/* Current Entries List */}
      <View style={styles.chipContainer}>
        {value.map((entry, idx) => (
          <View key={idx} style={styles.chip}>
            <Text style={styles.chipText}>{formatSchedule([entry], lang)}</Text>
            <TouchableOpacity onPress={() => handleRemove(idx)} style={styles.chipRemove}>
              <Text style={styles.chipRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {value.length === 0 && <Text style={styles.emptyText}>{t.noData || 'No schedule added'}</Text>}
      </View>

      {/* Add New Entry Form */}
      <View style={styles.addForm}>
        <View style={styles.modeToggle}>
          <TouchableOpacity style={[styles.modeBtn, mode === 'weekly' && styles.modeBtnActive]} onPress={() => setMode('weekly')}>
            <Text style={[styles.modeBtnText, mode === 'weekly' && styles.modeBtnTextActive]}>{lang === 'zh-CN' ? '按周重复' : 'Weekly'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, mode === 'specific' && styles.modeBtnActive]} onPress={() => setMode('specific')}>
            <Text style={[styles.modeBtnText, mode === 'specific' && styles.modeBtnTextActive]}>{lang === 'zh-CN' ? '特定日期' : 'Specific'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputsRow}>
          {mode === 'weekly' ? (
            <View style={styles.daysRow}>
              {daysMap.map((d, i) => (
                <TouchableOpacity key={i} style={[styles.dayCircle, selectedDay === i && styles.dayCircleActive]} onPress={() => setSelectedDay(i)}>
                  <Text style={[styles.dayText, selectedDay === i && styles.dayTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TextInput style={styles.input} value={dateStr} onChangeText={setDateStr} placeholder="YYYY-MM-DD" />
          )}
        </View>

        <View style={styles.timeRow}>
          <TextInput style={styles.timeInput} value={timeStr} onChangeText={setTimeStr} placeholder="HH:mm" />
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  chipText: { fontSize: 12, color: '#1E3A8A' },
  chipRemove: { marginLeft: 6 },
  chipRemoveText: { fontSize: 12, color: '#3B82F6', fontWeight: 'bold' },
  emptyText: { color: '#94A3B8', fontSize: 12, fontStyle: 'italic' },
  addForm: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  modeToggle: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#E2E8F0', borderRadius: 6, padding: 2 },
  modeBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 4 },
  modeBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2 },
  modeBtnText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  modeBtnTextActive: { color: '#0F172A' },
  inputsRow: { marginBottom: 12 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  dayCircleActive: { backgroundColor: '#3B82F6' },
  dayText: { fontSize: 12, color: '#475569' },
  dayTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14 },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeInput: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14 },
  addBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  addBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});