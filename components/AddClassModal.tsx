import React from 'react';
import { Modal, View } from 'react-native';

interface AddClassModalProps {
  visible: boolean;
}

export default function AddClassModal({ visible }: AddClassModalProps) {
  return (
    <Modal visible={visible} transparent>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Stub content */}
      </View>
    </Modal>
  );
}
