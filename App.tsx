import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  useColorScheme,
  Switch,
  StatusBar,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type HistoryEntry = {
  expression: string;
  result: string;
  id: number;
};

type Theme = {
  bg: string;
  displayBg: string;
  text: string;
  subText: string;
  btnNum: string;
  btnOp: string;
  btnFn: string;
  btnEq: string;
  btnSpec: string;
  btnNumText: string;
  btnOpText: string;
  historyBg: string;
  historyRow: string;
  border: string;
};

// ─── Themes ───────────────────────────────────────────────────────────────────

const DARK: Theme = {
  bg: '#1C1C1E',
  displayBg: '#2C2C2E',
  text: '#FFFFFF',
  subText: '#AEAEB2',
  btnNum: '#3A3A3C',
  btnOp: '#FF9F0A',
  btnFn: '#48484A',
  btnEq: '#FF9F0A',
  btnSpec: '#636366',
  btnNumText: '#FFFFFF',
  btnOpText: '#FFFFFF',
  historyBg: '#2C2C2E',
  historyRow: '#3A3A3C',
  border: '#48484A',
};

const LIGHT: Theme = {
  bg: '#F2F2F7',
  displayBg: '#FFFFFF',
  text: '#000000',
  subText: '#6C6C70',
  btnNum: '#FFFFFF',
  btnOp: '#FF9F0A',
  btnFn: '#E5E5EA',
  btnEq: '#FF9F0A',
  btnSpec: '#C7C7CC',
  btnNumText: '#000000',
  btnOpText: '#FFFFFF',
  historyBg: '#FFFFFF',
  historyRow: '#F2F2F7',
  border: '#D1D1D6',
};

// ─── Expression Evaluator ─────────────────────────────────────────────────────

function evaluate(expr: string): number {
  const prepared = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, `(${Math.PI})`)
    .replace(/\be\b/g, `(${Math.E})`)
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/asin\(/g, 'Math.asin(')
    .replace(/acos\(/g, 'Math.acos(')
    .replace(/atan\(/g, 'Math.atan(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/√\(/g, 'Math.sqrt(')
    .replace(/\^/g, '**');

  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${prepared})`)() as number;
  if (!isFinite(result)) throw new Error('Nieskończoność');
  return result;
}

function formatNumber(n: number): string {
  if (Math.abs(n) > 1e12 || (Math.abs(n) < 1e-6 && n !== 0)) {
    return n.toExponential(6);
  }
  const fixed = parseFloat(n.toPrecision(10));
  return String(fixed);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const BTN_GAP = 10;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function App() {
  const systemScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(systemScheme === 'dark');
  const [scientificMode, setScientificMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Calculator state
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const idRef = useRef(0);

  const theme = darkMode ? DARK : LIGHT;

  // ── Input handling ──────────────────────────────────────────────────────────

  const pressDigit = useCallback((digit: string) => {
    if (justEvaluated) {
      setDisplay(digit);
      setExpression(digit);
      setJustEvaluated(false);
    } else {
      const newDisplay = display === '0' ? digit : display + digit;
      setDisplay(newDisplay);
      setExpression(prev => prev + digit);
    }
  }, [display, justEvaluated]);

  const pressDecimal = useCallback(() => {
    const lastNum = display.split(/[+\-×÷^()]/).pop() ?? '';
    if (lastNum.includes('.')) return;
    if (justEvaluated) {
      setDisplay('0.');
      setExpression('0.');
      setJustEvaluated(false);
    } else {
      if (display === '0' || display === '') {
        setDisplay('0.');
        setExpression(prev => prev + '0.');
      } else {
        setDisplay(prev => prev + '.');
        setExpression(prev => prev + '.');
      }
    }
  }, [display, justEvaluated]);

  const pressOperator = useCallback((op: string) => {
    setJustEvaluated(false);
    const newExpr = expression + op;
    setExpression(newExpr);
    setDisplay(newExpr);
  }, [expression]);

  const pressFunction = useCallback((fn: string) => {
    setJustEvaluated(false);
    const newExpr = expression + fn + '(';
    setExpression(newExpr);
    setDisplay(newExpr);
  }, [expression]);

  const pressConstant = useCallback((c: string) => {
    if (justEvaluated) {
      setExpression(c);
      setDisplay(c);
      setJustEvaluated(false);
    } else {
      const newExpr = expression + c;
      setExpression(newExpr);
      setDisplay(newExpr);
    }
  }, [expression, justEvaluated]);

  const pressParen = useCallback((p: string) => {
    setJustEvaluated(false);
    const newExpr = expression + p;
    setExpression(newExpr);
    setDisplay(newExpr);
  }, [expression]);

  const pressPercent = useCallback(() => {
    try {
      const val = evaluate(expression) / 100;
      const res = formatNumber(val);
      setDisplay(res);
      setExpression(res);
      setJustEvaluated(true);
    } catch {
      setDisplay('Błąd');
    }
  }, [expression]);

  const pressToggleSign = useCallback(() => {
    try {
      const val = evaluate(expression) * -1;
      const res = formatNumber(val);
      setDisplay(res);
      setExpression(res);
    } catch {
      if (expression.startsWith('-')) {
        setExpression(expression.slice(1));
        setDisplay(display.startsWith('-') ? display.slice(1) : display);
      } else {
        setExpression('-' + expression);
        setDisplay('-' + display);
      }
    }
  }, [expression, display]);

  const pressBackspace = useCallback(() => {
    if (justEvaluated) {
      pressAllClear();
      return;
    }
    const newExpr = expression.slice(0, -1) || '0';
    setExpression(newExpr);
    setDisplay(newExpr);
  }, [expression, justEvaluated]);

  const pressAllClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setJustEvaluated(false);
  }, []);

  const pressSquare = useCallback(() => {
    if (!expression) return;
    const newExpr = '(' + expression + ')^(2)';
    setExpression(newExpr);
    setDisplay(newExpr);
    setJustEvaluated(false);
  }, [expression]);

  const pressEquals = useCallback(() => {
    if (!expression) return;
    try {
      const result = evaluate(expression);
      const res = formatNumber(result);
      setDisplay(res);

      const entry: HistoryEntry = {
        expression,
        result: res,
        id: ++idRef.current,
      };
      setHistory(prev => [entry, ...prev].slice(0, 50));
      setExpression(res);
      setJustEvaluated(true);
    } catch {
      setDisplay('Błąd');
      setExpression('');
      setJustEvaluated(false);
    }
  }, [expression]);

  const restoreHistory = useCallback((entry: HistoryEntry) => {
    setExpression(entry.result);
    setDisplay(entry.result);
    setShowHistory(false);
    setJustEvaluated(true);
  }, []);

  // ── Column widths ───────────────────────────────────────────────────────────

  const numCols = scientificMode ? 5 : 4;
  const btnW = (SCREEN_W - BTN_GAP * (numCols + 1)) / numCols;
  const btnH = btnW * 0.85;

  // ── Button renderer ─────────────────────────────────────────────────────────

  const Btn = useCallback(({
    label,
    onPress,
    color,
    textColor,
    flex = 1,
  }: {
    label: string;
    onPress: () => void;
    color: string;
    textColor: string;
    flex?: number;
  }) => {
    const fontSize = label.length > 4 ? 13 : label.length > 2 ? 16 : 22;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[
          styles.btn,
          {
            backgroundColor: color,
            width: btnW * flex + BTN_GAP * (flex - 1),
            height: btnH,
            borderRadius: btnH / 2,
          },
        ]}
      >
        <Text style={[styles.btnText, { color: textColor, fontSize }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }, [btnW, btnH]);

  // ── Row renderer ────────────────────────────────────────────────────────────

  const Row = ({ children }: { children: React.ReactNode }) => (
    <View style={[styles.row, { gap: BTN_GAP }]}>{children}</View>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  const displayFontSize = display.length > 14 ? 26 : display.length > 9 ? 36 : 52;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => setScientificMode(!scientificMode)}
          style={[styles.topBtn, scientificMode && { backgroundColor: theme.border }]}
        >
          <Text style={[styles.topBtnText, { color: theme.subText }]}>
            {scientificMode ? '🔢 Podstawowy' : '🔬 Naukowy'}
          </Text>
        </TouchableOpacity>

        <View style={styles.themeSwitch}>
          <Text style={{ color: theme.subText, fontSize: 14 }}>
            {darkMode ? '🌙' : '☀️'}
          </Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#C7C7CC', true: '#FF9F0A' }}
            thumbColor="#FFFFFF"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>


      {/* ── Display ── */}
      <View style={[styles.display, { backgroundColor: theme.displayBg }]}>
        {/* Historia ostatnich obliczeń w górnej części */}
        <View style={styles.displayHistory}>
          {history.slice(0, 3).reverse().map(entry => (
            <TouchableOpacity key={entry.id} onPress={() => restoreHistory(entry)}>
              <Text style={[styles.displayHistoryLine, { color: theme.subText }]} numberOfLines={1}>
                {entry.expression} = {entry.result}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Aktualne obliczenie */}
        <Text
          style={[styles.displayMain, { color: theme.text, fontSize: displayFontSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {display}
        </Text>
      </View>

      {/* ── Buttons ── */}
      <View style={[styles.keypad, { gap: BTN_GAP }]}>
        {scientificMode ? (
          // ── Scientific layout: podstawowy 4-kol + 1 kolumna naukowa z prawej ──
          <>
            {/* Rząd A (nad klawiaturą): funkcje odwrotne + nawiasy */}
            <Row>
              <Btn label="asin" onPress={() => pressFunction('asin')} color={theme.btnFn}   textColor={theme.btnNumText} />
              <Btn label="acos" onPress={() => pressFunction('acos')} color={theme.btnFn}   textColor={theme.btnNumText} />
              <Btn label="atan" onPress={() => pressFunction('atan')} color={theme.btnFn}   textColor={theme.btnNumText} />
              <Btn label="("    onPress={() => pressParen('(')}        color={theme.btnSpec} textColor="#FFFFFF" />
              <Btn label=")"    onPress={() => pressParen(')')}        color={theme.btnSpec} textColor="#FFFFFF" />
            </Row>
            {/* Rząd B (nad klawiaturą): √ ^ π e x² */}
            <Row>
              <Btn label="√"   onPress={() => pressFunction('√')}  color={theme.btnFn} textColor={theme.btnNumText} />
              <Btn label="^"   onPress={() => pressOperator('^')}  color={theme.btnFn} textColor={theme.btnNumText} />
              <Btn label="π"   onPress={() => pressConstant('π')}  color={theme.btnFn} textColor={theme.btnNumText} />
              <Btn label="e"   onPress={() => pressConstant('e')}  color={theme.btnFn} textColor={theme.btnNumText} />
              <Btn label="x²"  onPress={pressSquare}               color={theme.btnFn} textColor={theme.btnNumText} />
            </Row>
            {/* Rząd 1: AC +/- % ÷ | sin */}
            <Row>
              <Btn label="AC"  onPress={pressAllClear}                color={theme.btnSpec} textColor="#FFFFFF" />
              <Btn label="+/-" onPress={pressToggleSign}              color={theme.btnSpec} textColor="#FFFFFF" />
              <Btn label="%"   onPress={pressPercent}                 color={theme.btnSpec} textColor="#FFFFFF" />
              <Btn label="÷"   onPress={() => pressOperator('÷')}    color={theme.btnOp}   textColor={theme.btnOpText} />
              <Btn label="sin" onPress={() => pressFunction('sin')}  color={theme.btnFn}   textColor={theme.btnNumText} />
            </Row>
            {/* Rząd 2: 7 8 9 × | cos */}
            <Row>
              <Btn label="7"   onPress={() => pressDigit('7')}       color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="8"   onPress={() => pressDigit('8')}       color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="9"   onPress={() => pressDigit('9')}       color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="×"   onPress={() => pressOperator('×')}    color={theme.btnOp}   textColor={theme.btnOpText} />
              <Btn label="cos" onPress={() => pressFunction('cos')}  color={theme.btnFn}   textColor={theme.btnNumText} />
            </Row>
            {/* Rząd 3: 4 5 6 − | tan */}
            <Row>
              <Btn label="4"   onPress={() => pressDigit('4')}       color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="5"   onPress={() => pressDigit('5')}       color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="6"   onPress={() => pressDigit('6')}       color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="−"   onPress={() => pressOperator('-')}    color={theme.btnOp}   textColor={theme.btnOpText} />
              <Btn label="tan" onPress={() => pressFunction('tan')}  color={theme.btnFn}   textColor={theme.btnNumText} />
            </Row>
            {/* Rząd 4: 1 2 3 + | log */}
            <Row>
              <Btn label="1"   onPress={() => pressDigit('1')}       color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="2"   onPress={() => pressDigit('2')}       color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="3"   onPress={() => pressDigit('3')}       color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="+"   onPress={() => pressOperator('+')}    color={theme.btnOp}   textColor={theme.btnOpText} />
              <Btn label="log" onPress={() => pressFunction('log')}  color={theme.btnFn}   textColor={theme.btnNumText} />
            </Row>
            {/* Rząd 5: ⌫ 0 . = | ln */}
            <Row>
              <Btn label="⌫"  onPress={pressBackspace}               color={theme.btnSpec} textColor="#FFFFFF" />
              <Btn label="0"   onPress={() => pressDigit('0')}       color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="."   onPress={pressDecimal}                 color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="="   onPress={pressEquals}                  color={theme.btnEq}   textColor="#FFFFFF" />
              <Btn label="ln"  onPress={() => pressFunction('ln')}   color={theme.btnFn}   textColor={theme.btnNumText} />
            </Row>
          </>
        ) : (
          // ── Basic layout (classic iOS-style) ──
          <>
            {/* Row 1 */}
            <Row>
              <Btn label="AC"   onPress={pressAllClear}                color={theme.btnSpec} textColor="#FFFFFF" />
              <Btn label="+/-"  onPress={pressToggleSign}              color={theme.btnSpec} textColor="#FFFFFF" />
              <Btn label="%"    onPress={pressPercent}                 color={theme.btnSpec} textColor="#FFFFFF" />
              <Btn label="÷"    onPress={() => pressOperator('÷')}     color={theme.btnOp}   textColor={theme.btnOpText} />
            </Row>
            {/* Row 2 */}
            <Row>
              <Btn label="7"    onPress={() => pressDigit('7')}        color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="8"    onPress={() => pressDigit('8')}        color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="9"    onPress={() => pressDigit('9')}        color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="×"    onPress={() => pressOperator('×')}     color={theme.btnOp}   textColor={theme.btnOpText} />
            </Row>
            {/* Row 3 */}
            <Row>
              <Btn label="4"    onPress={() => pressDigit('4')}        color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="5"    onPress={() => pressDigit('5')}        color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="6"    onPress={() => pressDigit('6')}        color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="−"    onPress={() => pressOperator('-')}     color={theme.btnOp}   textColor={theme.btnOpText} />
            </Row>
            {/* Row 4 */}
            <Row>
              <Btn label="1"    onPress={() => pressDigit('1')}        color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="2"    onPress={() => pressDigit('2')}        color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="3"    onPress={() => pressDigit('3')}        color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="+"    onPress={() => pressOperator('+')}     color={theme.btnOp}   textColor={theme.btnOpText} />
            </Row>
            {/* Row 5 */}
            <Row>
              <Btn label="⌫"   onPress={pressBackspace}               color={theme.btnSpec} textColor="#FFFFFF" />
              <Btn label="0"    onPress={() => pressDigit('0')}        color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="."    onPress={pressDecimal}                  color={theme.btnNum}  textColor={theme.btnNumText} />
              <Btn label="="    onPress={pressEquals}                  color={theme.btnEq}   textColor="#FFFFFF" />
            </Row>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  topBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  themeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyPanel: {
    maxHeight: 200,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    margin: 10,
    padding: 8,
  },
  historyEmpty: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  historyRow: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  historyExpr: {
    fontSize: 12,
    marginBottom: 2,
  },
  historyResult: {
    fontSize: 18,
    fontWeight: '600',
  },
  display: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    margin: 10,
    borderRadius: 16,
  },
  displayHistory: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  displayHistoryLine: {
    fontSize: 14,
    marginBottom: 3,
    opacity: 0.7,
  },
  displayMain: {
    fontWeight: '200',
    letterSpacing: -1,
  },
  keypad: {
    padding: BTN_GAP,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  btnText: {
    fontWeight: '400',
  },
});
