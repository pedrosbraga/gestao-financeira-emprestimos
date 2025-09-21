import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MonthlyScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Controle Mensal</Text>
      <Text style={styles.subtitle}>To be implemented in task 7</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default MonthlyScreen;
