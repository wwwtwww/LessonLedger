import React from 'react';
import { Modal, View } from 'react-native';

interface AddMemberModalProps {
  visible: boolean;
}

export default function AddMemberModal({ visible }: AddMemberModalProps) {
  return (
    <Modal visible={visible} transparent>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Stub content */}
      </View>
    </Modal>
  );
}
