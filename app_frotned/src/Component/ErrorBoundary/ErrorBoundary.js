import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Clipboard,
} from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.log('=== CRASH CAUGHT BY ErrorBoundary ===');
    console.log('Error:', error?.message);
    console.log('Stack:', error?.stack);
    console.log('Component Stack:', errorInfo?.componentStack);
    console.log('=====================================');
  }

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || 'Unknown error';
      const stack = this.state.error?.stack || '';
      const componentStack = this.state.errorInfo?.componentStack || '';
      const fullLog = `ERROR: ${errMsg}\n\nSTACK:\n${stack}\n\nCOMPONENT TREE:\n${componentStack}`;

      return (
        <View style={styles.container}>
          <Text style={styles.title}>💥 App Crashed!</Text>
          <Text style={styles.subtitle}>Share this with developer:</Text>
          <ScrollView style={styles.logBox}>
            <Text style={styles.logText} selectable={true}>
              {fullLog}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => {
              try { Clipboard.setString(fullLog); } catch(e) {}
            }}
          >
            <Text style={styles.copyBtnText}>📋 Copy Error Log</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            <Text style={styles.retryBtnText}>🔄 Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#ff6b6b',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
  },
  logBox: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  logText: {
    color: '#00ff88',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  copyBtn: {
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#00ff88',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  copyBtnText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryBtn: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
