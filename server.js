// ============================================
// 🎲 TX TREND API - Render Ready (Port 3000)
// ============================================
const express = require('express');
const cors = require('cors');

const app = express();

// ✅ PORT: Render tự gán qua process.env.PORT, fallback 3000
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============================================
// CẤU HÌNH API NGUỒN
// ============================================
const API_URL = 'https://wtxmd52.tele68.com/v1/txmd5/sessions';

// ============================================
// ✅ FETCH ĐỘNG - Hoạt động cả Node 18+ và Node cũ
// ============================================
const fetchData = async (url) => {
    if (typeof fetch !== 'undefined') {
        return fetch(url);
    }
    const { default: nodeFetch } = await import('node-fetch');
    return nodeFetch(url);
};

// ============================================
// STATE TOÀN CỤC
// ============================================
let APP_STATE = {
    history: [],
    lastPrediction: null,
    stats: { total: 0, win: 0, loss: 0 },
    predictionHistory: []
};

// ============================================
// ENGINE DỰ ĐOÁN - PHÂN TÍCH ĐA MẪU CẦU
// ============================================
class AdvancedTrendPredictor {
    
    constructor() {
        this.weights = {
            cauDay: 1.3,
            cauCheo: 1.2,
            cau22: 1.15,
            cau32: 1.1,
            cauBat: 1.25,
            cauNghieng: 1.0,
            cauDao: 0.95,
            cauLap: 1.05,
            cauGay: 0.9
        };
    }

    // ===== HÀM CHÍNH =====
    predict(sessionId, history) {
        if (history.length < 8) {
            return this.predictEarly(sessionId, history);
        }

        const results = history.map(h => h.result);
        const signals = this.collectAllSignals(results);
        const decision = this.makeDecision(signals, results);
        
        this.logDecision(signals, decision);

        return {
            phien: sessionId,
            ketqua: decision.prediction,
            do_tin_cay: decision.confidence + '%',
            ly_do: decision.reason
        };
    }

    // ===== DỰ ĐOÁN KHI CHƯA ĐỦ DỮ LIỆU =====
    predictEarly(sessionId, history) {
        const lastResult = history[history.length - 1]?.result || 'Tài';
        const prediction = Math.random() < 0.55 ? lastResult : this.opposite(lastResult);
        return {
            phien: sessionId,
            ketqua: prediction,
            do_tin_cay: '60%',
            ly_do: 'Khởi tạo - bám cầu nhẹ'
        };
    }
// ===== THU THẬP TẤT CẢ TÍN HIỆU =====
collectAllSignals(results) {
    return {
        cauDay: this.detectCauDay(results),
        cauCheo: this.detectCauCheo(results),
        cau22: this.detectCau22(results),
        cau32: this.detectCau32(results),
        cauBat: this.detectCauBat(results),
        cauNghieng: this.detectCauNghieng(results),
        cauDao: this.detectCauDao(results),
        cauLap: this.detectCauLap(results),
        cauGay: this.detectCauGay(results),
        cauNhip: this.detectCauNhip(results),
        cau12: this.detectCau12(results),
        cau3Nhip: this.detectCau3Nhip(results),
        phanTichDiem: this.analyzeScore(results)
    };
}

// ===== 1. CẦU DÂY (BỆT) =====
detectCauDay(results) {
    const lastResult = results[results.length - 1];
    let chainLength = 1;
    
    for (let i = results.length - 2; i >= 0; i--) {
        if (results[i] === lastResult) chainLength++;
        else break;
    }

    let prediction, confidence, note;
    
    if (chainLength === 1) {
        return { active: false, chainLength: 1 };
    } else if (chainLength === 2) {
        prediction = Math.random() < 0.55 ? lastResult : this.opposite(lastResult);
        confidence = 60;
        note = `Bệt 2 (${lastResult})`;
    } else if (chainLength === 3) {
        prediction = Math.random() < 0.5 ? lastResult : this.opposite(lastResult);
        confidence = 62;
        note = `Bệt 3 (${lastResult})`;
    } else if (chainLength === 4) {
        prediction = this.opposite(lastResult);
        confidence = 70;
        note = `Bệt 4 sắp đứt (${lastResult})`;
    } else {
        prediction = this.opposite(lastResult);
        confidence = 75;
        note = `Bệt ${chainLength} - đảo mạnh`;
    }

    return {
        active: true,
        chainLength,
        prediction,
        confidence,
        note,
        weight: this.weights.cauDay
    };
}

// ===== 2. CẦU CHÉO (1-1) =====
detectCauCheo(results) {
    if (results.length < 4) return { active: false };

    let cheoLength = 0;
    for (let i = results.length - 1; i > 0; i--) {
        if (results[i] !== results[i - 1]) cheoLength++;
        else break;
    }

    if (cheoLength >= 3) {
        const lastResult = results[results.length - 1];
        const prediction = this.opposite(lastResult);
        const confidence = cheoLength >= 5 ? 65 : 72;
        
        return {
            active: true,
            cheoLength,
            prediction,
            confidence,
            note: `Cầu chéo ${cheoLength} nhịp`,
            weight: this.weights.cauCheo
        };
    }

    return { active: false };
}

// ===== 3. CẦU 2-2 =====
detectCau22(results) {
    if (results.length < 6) return { active: false };

    const last6 = results.slice(-6);
    const groups = this.groupBy2(last6);
    
    if (groups.length >= 2) {
        const lastGroup = groups[groups.length - 1];
        const prevGroup = groups[groups.length - 2];
        
        if (lastGroup.count === 2 && prevGroup.count === 2 && lastGroup.value !== prevGroup.value) {
            const prediction = prevGroup.value;
            return {
                active: true,
                prediction,
                confidence: 70,
                note: `Cầu 2-2 (${prevGroup.value}-${lastGroup.value})`,
                weight: this.weights.cau22
            };
        }
        
        if (lastGroup.count === 1 && prevGroup.count === 2) {
            const prediction = lastGroup.value;
            return {
                active: true,
                prediction,
                confidence: 68,
                note: `Cầu 2-2 (nhóm mới ${lastGroup.value})`,
                weight: this.weights.cau22
            };
        }
    }

    return { active: false };
}
// ===== 4. CẦU 3-2-3 =====
detectCau32(results) {
    if (results.length < 7) return { active: false };

    const last7 = results.slice(-7);
    const groups = this.groupByCount(last7);

    if (groups.length >= 3) {
        const [g1, g2, g3] = groups.slice(-3);
        
        if (g1.count === 3 && g2.count === 2 && g3.count <= 3) {
            if (g3.count === 3) {
                return {
                    active: true,
                    prediction: this.opposite(g3.value),
                    confidence: 73,
                    note: `Cầu 3-2-3 (đủ 3 ${g3.value})`,
                    weight: this.weights.cau32
                };
            } else {
                return {
                    active: true,
                    prediction: g3.value,
                    confidence: 70,
                    note: `Cầu 3-2-3 (tiếp ${g3.value} - ${g3.count}/3)`,
                    weight: this.weights.cau32
                };
            }
        }
    }

    return { active: false };
}

// ===== 5. CẦU BỆT NGẮN (BỆT 2 ĐẢO) =====
detectCauBat(results) {
    if (results.length < 5) return { active: false };

    const last5 = results.slice(-5);
    
    if (last5[3] === last5[4]) {
        const lastValue = last5[4];
        
        if (last5[1] === last5[2] && last5[2] !== lastValue) {
            return {
                active: true,
                prediction: this.opposite(lastValue),
                confidence: 68,
                note: `Bệt 2 (${lastValue}) - chuẩn bị đảo`,
                weight: this.weights.cauBat
            };
        }
    }

    return { active: false };
}

// ===== 6. CẦU NGHIÊNG =====
detectCauNghieng(results) {
    const last10 = results.slice(-10);
    const taiCount = last10.filter(r => r === 'Tài').length;
    const xiuCount = last10.length - taiCount;
    
    const diff = Math.abs(taiCount - xiuCount);
    const strength = diff / last10.length;

    if (strength >= 0.6 && diff >= 4) {
        const mainTrend = taiCount > xiuCount ? 'Tài' : 'Xỉu';
        return {
            active: true,
            prediction: mainTrend,
            confidence: 65 + Math.round(strength * 15),
            note: `Cầu nghiêng ${mainTrend} (${taiCount}T-${xiuCount}X)`,
            weight: this.weights.cauNghieng
        };
    }

    return { active: false };
}

// ===== 7. CẦU ĐẢO =====
detectCauDao(results) {
    if (results.length < 6) return { active: false };

    const cauDay = this.detectCauDay(results);
    if (cauDay.active && cauDay.chainLength >= 4) {
        return {
            active: true,
            prediction: this.opposite(results[results.length - 1]),
            confidence: 72,
            note: `Đảo sau bệt ${cauDay.chainLength}`,
            weight: this.weights.cauDao
        };
    }

    return { active: false };
}

// ===== 8. CẦU LẶP PATTERN =====
detectCauLap(results) {
    if (results.length < 8) return { active: false };

    const last8 = results.slice(-8);
    const first4 = last8.slice(0, 4);
    const last4 = last8.slice(4, 8);
    
    if (this.arraysEqual(first4, last4)) {
        const prediction = first4[0];
        return {
            active: true,
            prediction,
            confidence: 75,
            note: `Pattern lặp 4-4`,
            weight: this.weights.cauLap
        };
    }

    const first3 = last8.slice(2, 5);
    const last3 = last8.slice(5, 8);
    
    if (this.arraysEqual(first3, last3)) {
        const prediction = first3[0];
        return {
            active: true,
            prediction,
            confidence: 70,
            note: `Pattern lặp 3-3`,
            weight: this.weights.cauLap
        };
    }

    return { active: false };
}

// ===== 9. CẦU GÃY =====
detectCauGay(results) {
    if (results.length < 5) return { active: false };

    const cauCheo = this.detectCauCheo(results.slice(0, -1));
    const cauDay = this.detectCauDay(results);
    
    if (cauCheo.active && cauDay.active && cauDay.chainLength === 2) {
        return {
            active: true,
            prediction: results[results.length - 1],
            confidence: 62,
            note: `Cầu gãy chéo→bệt`,
            weight: this.weights.cauGay
        };
    }

    return { active: false };
}

// ===== 10. CẦU NHỊP (1-2-1) =====
detectCauNhip(results) {
    if (results.length < 7) return { active: false };

    const last7 = results.slice(-7);
    const groups = this.groupByCount(last7);

    if (groups.length >= 3) {
        const [g1, g2, g3] = groups.slice(-3);
        
        if (g1.count === 1 && g2.count === 2 && g3.count === 1) {
            return {
                active: true,
                prediction: this.opposite(g3.value),
                confidence: 72,
                note: `Cầu nhịp 1-2-1`,
                weight: 1.1
            };
        }
    }

    return { active: false };
}

// ===== 11. CẦU 1-2 =====
detectCau12(results) {
    if (results.length < 5) return { active: false };

    const last5 = results.slice(-5);
    const groups = this.groupByCount(last5);

    if (groups.length >= 2) {
        const [g1, g2] = groups.slice(-2);
        
        if (g1.count === 1 && g2.count === 2) {
            return {
                active: true,
                prediction: g1.value,
                confidence: 68,
                note: `Cầu 1-2`,
                weight: 1.05
            };
        }
    }

    return { active: false };
}

// ===== 12. CẦU 3 NHỊP =====
detectCau3Nhip(results) {
    if (results.length < 6) return { active: false };

    const last6 = results.slice(-6);
    const groups = this.groupByCount(last6);

    if (groups.length >= 2) {
        const [g1, g2] = groups.slice(-2);
        
        if (g1.count === 3 && g2.count <= 3) {
            if (g2.count === 3) {
                return {
                    active: true,
                    prediction: this.opposite(g2.value),
                    confidence: 74,
                    note: `Cầu 3-3 (đủ 3)`,
                    weight: 1.15
                };
            }
            return {
                active: true,
                prediction: g2.value,
                confidence: 70,
                note: `Cầu 3-3 (${g2.count}/3)`,
                weight: 1.15
            };
        }
    }

    return { active: false };
}

// ===== 13. PHÂN TÍCH ĐIỂM SỐ =====
analyzeScore(results) {
    return { active: false };
}
    // ===== TỔNG HỢP VÀ QUYẾT ĐỊNH =====
    makeDecision(signals, results) {
        const activeSignals = [];
        let taiScore = 0;
        let xiuScore = 0;

        for (const [name, signal] of Object.entries(signals)) {
            if (signal && signal.active && signal.prediction) {
                const weight = signal.weight || 1;
                const score = (signal.confidence / 100) * weight;
                
                activeSignals.push({
                    name,
                    ...signal,
                    score
                });

                if (signal.prediction === 'Tài') {
                    taiScore += score;
                } else {
                    xiuScore += score;
                }
            }
        }

        if (activeSignals.length === 0) {
            const lastResult = results[results.length - 1];
            return {
                prediction: this.opposite(lastResult),
                confidence: 55,
                reason: 'Không có cầu rõ - đảo nhẹ',
                signals: []
            };
        }

        activeSignals.sort((a, b) => b.score - a.score);

        let prediction, confidence, reason;

        if (taiScore > xiuScore * 1.3) {
            prediction = 'Tài';
            confidence = Math.min(90, 65 + (taiScore - xiuScore) * 10);
            reason = `Tín hiệu Tài mạnh (${taiScore.toFixed(2)} vs ${xiuScore.toFixed(2)})`;
        } else if (xiuScore > taiScore * 1.3) {
            prediction = 'Xỉu';
            confidence = Math.min(90, 65 + (xiuScore - taiScore) * 10);
            reason = `Tín hiệu Xỉu mạnh (${xiuScore.toFixed(2)} vs ${taiScore.toFixed(2)})`;
        } else {
            const strongest = activeSignals[0];
            prediction = strongest.prediction;
            confidence = strongest.confidence;
            reason = `Signal mạnh nhất: ${strongest.note}`;
        }

        const totalSignals = activeSignals.length;
        const sameDirection = activeSignals.filter(s => s.prediction === prediction).length;
        const agreement = sameDirection / totalSignals;
        
        if (agreement >= 0.7) {
            confidence = Math.min(92, confidence + 5);
        } else if (agreement < 0.5) {
            confidence = Math.max(55, confidence - 8);
        }

        return {
            prediction,
            confidence: Math.round(confidence),
            reason,
            signals: activeSignals.map(s => ({ name: s.name, note: s.note, conf: s.confidence }))
        };
    }

    // ===== HÀM HỖ TRỢ =====
    opposite(result) {
        return result === 'Tài' ? 'Xỉu' : 'Tài';
    }

    arraysEqual(a, b) {
        return a.length === b.length && a.every((v, i) => v === b[i]);
    }

    groupBy2(arr) {
        const groups = [];
        let current = { value: arr[0], count: 1 };
        
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] === current.value) {
                current.count++;
            } else {
                groups.push(current);
                current = { value: arr[i], count: 1 };
            }
        }
        groups.push(current);
        return groups;
    }

    groupByCount(arr) {
        const groups = [];
        let current = { value: arr[0], count: 1 };
        
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] === current.value) {
                current.count++;
            } else {
                groups.push(current);
                current = { value: arr[i], count: 1 };
            }
        }
        groups.push(current);
        return groups;
    }

    // ===== LOG =====
    logDecision(signals, decision) {
        const activeNames = Object.entries(signals)
            .filter(([_, s]) => s && s.active)
            .map(([name, s]) => `${name}(${s.note || 'active'})`);
        
        console.log(`🎯 Dự đoán: ${decision.prediction} (${decision.confidence}%)`);
        console.log(`📋 Lý do: ${decision.reason}`);
        if (activeNames.length > 0) {
            console.log(`🔍 Signals: ${activeNames.join(', ')}`);
        }
        console.log('---');
    }
}

const predictor = new AdvancedTrendPredictor();
// =========================================================================================
// ĐỒNG BỘ DỮ LIỆU
// =========================================================================================
async function syncData() {
    try {
        const res = await fetchData(API_URL);
        const data = await res.json();
        
        if (data?.list) {
            const newHistory = data.list.map(item => ({
                session: Number(item.id),
                result: item.resultTruyenThong === 'TAI' ? 'Tài' : 'Xỉu'
            })).reverse();

            const latest = newHistory[newHistory.length - 1];
            
            if (APP_STATE.lastPrediction && APP_STATE.lastPrediction.phien === latest.session) {
                APP_STATE.stats.total++;
                const isWin = APP_STATE.lastPrediction.ketqua === latest.result;
                
                if (isWin) {
                    APP_STATE.stats.win++;
                    console.log(`✅ THẮNG ${latest.session}: ${APP_STATE.lastPrediction.ketqua}`);
                } else {
                    APP_STATE.stats.loss++;
                    console.log(`❌ THUA ${latest.session}: ${APP_STATE.lastPrediction.ketqua} vs ${latest.result}`);
                }
                
                APP_STATE.predictionHistory.push({
                    session: latest.session,
                    prediction: APP_STATE.lastPrediction.ketqua,
                    actual: latest.result,
                    isWin,
                    reason: APP_STATE.lastPrediction.ly_do
                });
                
                const wr = (APP_STATE.stats.win / APP_STATE.stats.total * 100).toFixed(2);
                console.log(`📊 WINRATE: ${wr}% (${APP_STATE.stats.win}/${APP_STATE.stats.total})`);
                console.log('---');
                
                APP_STATE.lastPrediction = null;
            }

            APP_STATE.history = newHistory;
        }
    } catch (e) {
        console.error("Lỗi sync:", e.message);
    }
}

setInterval(syncData, 5000);

// =========================================================================================
// API ENDPOINTS
// =========================================================================================
app.get('/', async (req, res) => {
    await syncData();
    
    const last = APP_STATE.history[APP_STATE.history.length - 1];
    const nextId = last ? last.session + 1 : 1;
    
    if (!APP_STATE.lastPrediction || APP_STATE.lastPrediction.phien !== nextId) {
        APP_STATE.lastPrediction = predictor.predict(nextId, APP_STATE.history);
    }
    
    const pred = APP_STATE.lastPrediction;

    const winRate = APP_STATE.stats.total > 0 
        ? (APP_STATE.stats.win / APP_STATE.stats.total * 100).toFixed(2)
        : "0";

    res.json({
        "phien_truoc": last?.session || 0,
        "ketqua_truoc": last?.result || "",
        "phien_sau": nextId,
        "du_doan": pred.ketqua,
        "do_tin_cay": pred.do_tin_cay,
        "ly_do": pred.ly_do,
        "thong_ke": {
            "thang": APP_STATE.stats.win,
            "thua": APP_STATE.stats.loss,
            "tong": APP_STATE.stats.total,
            "winrate": winRate + "%"
        }
    });
});

// API xem lịch sử dự đoán
app.get('/history', (req, res) => {
    res.json({
        predictions: APP_STATE.predictionHistory.slice(-50),
        stats: APP_STATE.stats
    });
});

// Reset
app.get('/reset', (req, res) => {
    APP_STATE.stats = { total: 0, win: 0, loss: 0 };
    APP_STATE.predictionHistory = [];
    res.json({ message: "Reset thành công" });
});

// =========================================================================================
// ✅ LISTEN - Bind 0.0.0.0 cho Render
// =========================================================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('============================================');
    console.log(`🎲 TX TREND API - PORT ${PORT}`);
    console.log(`📊 Thuật toán: 13 mẫu cầu`);
    console.log(`⚖️  Cơ chế: Weighted Voting System`);
    console.log(`🌐 Ready for Render deployment`);
    console.log('============================================');
    syncData();
});