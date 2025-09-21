import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AuthMiddleware from '../src/services/auth/AuthMiddleware';

// Componente principal do app após autenticação
function MainApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Sistema Funcionando!</Text>
      <Text style={styles.subtitle}>
        Você está logado com sucesso!
      </Text>
      <Text style={styles.info}>
        ✅ Autenticação implementada
      </Text>
      <Text style={styles.info}>
        ✅ Supabase configurado
      </Text>
      <Text style={styles.info}>
        ✅ Usuários criados
      </Text>
      <Text style={styles.note}>
        Próximo: Implementar telas do sistema
      </Text>
    </View>
  );
}

export default function IndexScreen() {
  return (
    <AuthMiddleware>
      <MainApp />
    </AuthMiddleware>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    color: '#00D632',
    marginBottom: 12,
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});