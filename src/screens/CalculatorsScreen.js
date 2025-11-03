import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Text from '../components/CustomText';
import TextInput from '../components/CustomTextInput';
import { Ionicons } from '@expo/vector-icons';
import { xirr, formatRate, calculateCAGR } from '../utils/xirr';
import { formatCurrency } from '../utils/helpers';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';

const CalculatorsScreen = () => {
  const { colors } = useTheme();
  const [activeCalculator, setActiveCalculator] = useState('xirr');
  
  // XIRR Calculator State
  const [xirrTransactions, setXirrTransactions] = useState([
    { date: new Date().toISOString().split('T')[0], amount: -10000, type: 'investment' },
    { date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0], amount: 12000, type: 'redemption' }
  ]);
  
  // SIP Calculator State
  const [sipAmount, setSipAmount] = useState(5000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);
  const [sipInflation, setSipInflation] = useState(6);
  
  // CAGR Calculator State
  const [initialValue, setInitialValue] = useState(100000);
  const [finalValue, setFinalValue] = useState(250000);
  const [cagrYears, setCagrYears] = useState(5);

  // XIRR Calculation
  const calculateXIRR = () => {
    const cashflows = xirrTransactions.map(t => ({
      date: new Date(t.date),
      amount: t.type === 'investment' ? -Math.abs(t.amount) : Math.abs(t.amount)
    }));
    
    const xirrRate = xirr(cashflows);
    const totalInvested = xirrTransactions
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalRedeemed = xirrTransactions
      .filter(t => t.type === 'redemption' || t.type === 'dividend')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netGain = totalRedeemed - totalInvested;
    const absoluteReturn = totalInvested > 0 ? (netGain / totalInvested) * 100 : 0;
    
    return {
      xirrRate: xirrRate,
      totalInvested,
      totalRedeemed,
      netGain,
      absoluteReturn,
    };
  };
  
  // Add transaction for XIRR
  const addXirrTransaction = () => {
    setXirrTransactions([
      ...xirrTransactions,
      { 
        date: new Date().toISOString().split('T')[0], 
        amount: 10000, 
        type: 'investment' 
      }
    ]);
  };
  
  // Remove transaction for XIRR
  const removeXirrTransaction = (index) => {
    if (xirrTransactions.length > 2) {
      setXirrTransactions(xirrTransactions.filter((_, i) => i !== index));
    }
  };
  
  // Update transaction for XIRR
  const updateXirrTransaction = (index, field, value) => {
    const updated = [...xirrTransactions];
    if (field === 'amount') {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setXirrTransactions(updated);
  };
  
  // SIP Calculation with inflation adjustment
  const calculateSIP = () => {
    const monthlyRate = sipRate / 100 / 12;
    const months = sipYears * 12;
    const futureValue = sipAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const invested = sipAmount * months;
    const returns = futureValue - invested;
    
    // Calculate inflation-adjusted value
    const inflationRate = sipInflation / 100;
    const inflationAdjustedValue = futureValue / Math.pow(1 + inflationRate, sipYears);
    
    return {
      invested: Math.round(invested),
      returns: Math.round(returns),
      total: Math.round(futureValue),
      inflationAdjusted: Math.round(inflationAdjustedValue),
      purchasingPower: ((inflationAdjustedValue / futureValue) * 100).toFixed(1)
    };
  };
  
  // CAGR Calculation
  const calculateCAGRResult = () => {
    const cagr = calculateCAGR(initialValue, finalValue, cagrYears);
    const absoluteReturn = ((finalValue - initialValue) / initialValue) * 100;
    
    return {
      cagr: cagr.toFixed(2),
      absoluteReturn: absoluteReturn.toFixed(2),
      absoluteGain: finalValue - initialValue
    };
  };
  
  const xirrResult = calculateXIRR();
  const sipResult = calculateSIP();
  const cagrResult = calculateCAGRResult();

  const renderCalculatorTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            { backgroundColor: colors.surfaceSecondary },
            activeCalculator === 'xirr' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveCalculator('xirr')}
        >
          <Text style={[
            styles.tabText, 
            { color: colors.text },
            activeCalculator === 'xirr' && { color: colors.surface }
          ]}>
            XIRR
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            { backgroundColor: colors.surfaceSecondary },
            activeCalculator === 'sip' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveCalculator('sip')}
        >
          <Text style={[
            styles.tabText, 
            { color: colors.text },
            activeCalculator === 'sip' && { color: colors.surface }
          ]}>
            SIP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            { backgroundColor: colors.surfaceSecondary },
            activeCalculator === 'cagr' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveCalculator('cagr')}
        >
          <Text style={[
            styles.tabText, 
            { color: colors.text },
            activeCalculator === 'cagr' && { color: colors.surface }
          ]}>
            CAGR
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderXIRRCalculator = () => (
    <View style={[styles.calculatorPanel, { backgroundColor: colors.surface }]}>
      <Text style={[styles.calculatorTitle, { color: colors.text }]}>XIRR Calculator</Text>
      <Text style={[styles.calculatorDesc, { color: colors.textSecondary }]}>
        Calculate the Extended Internal Rate of Return for your irregular cash flows
      </Text>
      
      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={[styles.transactionsTitle, { color: colors.text }]}>Investment Transactions</Text>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={addXirrTransaction}>
            <Ionicons name="add" size={16} color={colors.surface} />
            <Text style={[styles.addButtonText, { color: colors.surface }]}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.transactionsList}>
          {xirrTransactions.map((transaction, index) => (
            <View key={index} style={styles.transactionRow}>
              <TextInput
                style={[styles.dateInput, { borderColor: colors.border, color: colors.text }]}
                value={transaction.date}
                onChangeText={(value) => updateXirrTransaction(index, 'date', value)}
                placeholder="Date"
                placeholderTextColor={colors.textSecondary}
              />
              <View style={styles.typeSelect}>
                <Text style={[styles.typeText, { color: colors.text }]}>
                  {transaction.type === 'investment' ? 'Investment' : 
                   transaction.type === 'redemption' ? 'Redemption' : 'Dividend'}
                </Text>
              </View>
              <TextInput
                style={[styles.amountInput, { borderColor: colors.border, color: colors.text }]}
                value={Math.abs(transaction.amount).toString()}
                onChangeText={(value) => updateXirrTransaction(index, 'amount', value)}
                placeholder="Amount"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.removeButton, xirrTransactions.length <= 2 && styles.disabledButton]}
                onPress={() => removeXirrTransaction(index)}
                disabled={xirrTransactions.length <= 2}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
      
      <View style={[styles.resultsContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>XIRR Analysis</Text>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>XIRR (Annualized Return)</Text>
          <Text style={[styles.resultValue, { color: colors.text }]}>
            {xirrResult.xirrRate ? formatRate(xirrResult.xirrRate) : '—'}
          </Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Total Invested</Text>
          <Text style={[styles.resultValue, { color: colors.text }]}>{formatCurrency(xirrResult.totalInvested)}</Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Total Redeemed</Text>
          <Text style={[styles.resultValue, { color: colors.text }]}>{formatCurrency(xirrResult.totalRedeemed)}</Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Net Gain/Loss</Text>
          <Text style={[
            styles.resultValue, 
            { color: xirrResult.netGain >= 0 ? colors.positive : colors.negative }
          ]}>
            {formatCurrency(xirrResult.netGain)}
          </Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Absolute Return</Text>
          <Text style={[
            styles.resultValue, 
            { color: xirrResult.absoluteReturn >= 0 ? colors.positive : colors.negative }
          ]}>
            {xirrResult.absoluteReturn.toFixed(2)}%
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSIPCalculator = () => (
    <View style={[styles.calculatorPanel, { backgroundColor: colors.surface }]}>
      <Text style={[styles.calculatorTitle, { color: colors.text }]}>SIP Calculator</Text>
      <Text style={[styles.calculatorDesc, { color: colors.textSecondary }]}>
        Calculate returns for your monthly SIP investments
      </Text>
      
      <View style={styles.inputSection}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Monthly Investment Amount</Text>
          <TextInput
            style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={sipAmount.toString()}
            onChangeText={(value) => setSipAmount(Number(value) || 0)}
            keyboardType="numeric"
            placeholder="Enter amount"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Expected Return Rate (% per annum)</Text>
          <TextInput
            style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={sipRate.toString()}
            onChangeText={(value) => setSipRate(Number(value) || 0)}
            keyboardType="numeric"
            placeholder="Enter rate"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Time Period (Years)</Text>
          <TextInput
            style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={sipYears.toString()}
            onChangeText={(value) => setSipYears(Number(value) || 0)}
            keyboardType="numeric"
            placeholder="Enter years"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Expected Inflation Rate (% per annum)</Text>
          <TextInput
            style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={sipInflation.toString()}
            onChangeText={(value) => setSipInflation(Number(value) || 0)}
            keyboardType="numeric"
            placeholder="Enter inflation rate"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>
      
      <View style={[styles.resultsContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>Investment Summary</Text>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Invested Amount</Text>
          <Text style={[styles.resultValue, { color: colors.text }]}>{formatCurrency(sipResult.invested)}</Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Est. Returns</Text>
          <Text style={[styles.resultValue, { color: colors.positive }]}>
            {formatCurrency(sipResult.returns)}
          </Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Total Value</Text>
          <Text style={[styles.resultValue, { color: colors.text }]}>
            {formatCurrency(sipResult.total)}
          </Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Inflation Adjusted Value</Text>
          <Text style={[styles.resultValue, { color: colors.text }]}>
            {formatCurrency(sipResult.inflationAdjusted)}
          </Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Purchasing Power</Text>
          <Text style={[styles.resultValue, { color: colors.text }]}>{sipResult.purchasingPower}%</Text>
        </View>
      </View>
    </View>
  );

  const renderCAGRCalculator = () => (
    <View style={[styles.calculatorPanel, { backgroundColor: colors.surface }]}>
      <Text style={[styles.calculatorTitle, { color: colors.text }]}>CAGR Calculator</Text>
      <Text style={[styles.calculatorDesc, { color: colors.textSecondary }]}>
        Calculate Compound Annual Growth Rate of your investment
      </Text>
      
      <View style={styles.inputSection}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Initial Value</Text>
          <TextInput
            style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={initialValue.toString()}
            onChangeText={(value) => setInitialValue(Number(value) || 0)}
            keyboardType="numeric"
            placeholder="Enter initial value"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Final Value</Text>
          <TextInput
            style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={finalValue.toString()}
            onChangeText={(value) => setFinalValue(Number(value) || 0)}
            keyboardType="numeric"
            placeholder="Enter final value"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Duration (Years)</Text>
          <TextInput
            style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={cagrYears.toString()}
            onChangeText={(value) => setCagrYears(Number(value) || 0)}
            keyboardType="numeric"
            placeholder="Enter duration"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>
      
      <View style={[styles.resultsContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>Growth Analysis</Text>
        <View style={[styles.resultItem, styles.highlightResult, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.resultLabel, { color: colors.text }]}>CAGR</Text>
          <Text style={[
            styles.resultValue, 
            styles.largeValue, 
            { color: parseFloat(cagrResult.cagr) >= 0 ? colors.positive : colors.negative }
          ]}>
            {cagrResult.cagr}%
          </Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Absolute Return</Text>
          <Text style={[
            styles.resultValue, 
            { color: parseFloat(cagrResult.absoluteReturn) >= 0 ? colors.positive : colors.negative }
          ]}>
            {cagrResult.absoluteReturn}%
          </Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Absolute Gain</Text>
          <Text style={[styles.resultValue, { color: colors.text }]}>
            {formatCurrency(cagrResult.absoluteGain)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Financial Calculators" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCalculatorTabs()}
        
        {activeCalculator === 'xirr' && renderXIRRCalculator()}
        {activeCalculator === 'sip' && renderSIPCalculator()}
        {activeCalculator === 'cagr' && renderCAGRCalculator()}
        
        <View style={[styles.disclaimer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.disclaimerTitle, { color: colors.text }]}>Disclaimer</Text>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            These calculators are for educational purposes only. The calculations are based on the inputs provided and assumed rates of return. 
            Actual returns may vary based on market conditions. Past performance does not guarantee future results. 
            Please consult with a qualified financial advisor before making investment decisions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#fff',
  },
  calculatorPanel: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calculatorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  calculatorDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  transactionsContainer: {
    marginBottom: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  transactionsList: {
    gap: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
  },
  typeSelect: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 14,
    color: '#1f2937',
  },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  resultsContainer: {
    padding: 16,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  highlightResult: {
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  largeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  returns: {
    color: '#059669',
  },
  total: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  profit: {
    color: '#059669',
  },
  loss: {
    color: '#dc2626',
  },
  disclaimer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
});

export default CalculatorsScreen;
