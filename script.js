/* script.js - Updated for Pro Design & Gamified Quiz */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggle Logic
    const themeBtn = document.getElementById('themeToggle');
    if(themeBtn){
        themeBtn.addEventListener('click', () => {
            const root = document.documentElement;
            const current = root.getAttribute('data-theme');
            root.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
        });
    }

    // 2. Global: Fetch Live Rates (Runs if ticker exists)
    if(document.getElementById('liveRates')) fetchRates();

    // 3. Page Specific Initialization
    if(document.getElementById('sipAmount')) initCalculators();
    if(document.getElementById('expenseList')) initTracker();
    if(document.getElementById('quizCard')) initQuiz(); // Updated ID check for new Quiz
    if(document.getElementById('budgetChart')) initHomeCharts();
});

// --- API: LIVE CURRENCY ---
async function fetchRates() {
    const ticker = document.getElementById('liveRates');
    try {
        const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
        const data = await res.json();
        ticker.innerHTML = `💱 <b>LIVE:</b> 1 USD = ₹${data.rates.INR} | 🇪🇺 1 EUR = ₹${(data.rates.INR * 0.92).toFixed(2)}`;
    } catch (e) {
        ticker.innerHTML = "💱 <b>LIVE:</b> 1 USD = ₹83.50 (Offline Mode)";
    }
}

// --- PAGE: CALCULATORS ---
let sipChartInstance = null;

function initCalculators() {
    // SIP Calculator
    window.calculateSIP = function() {
        const P = parseFloat(document.getElementById('sipAmount').value);
        const r = parseFloat(document.getElementById('sipRate').value);
        const n = parseFloat(document.getElementById('sipYears').value);

        if(!P || !r || !n) return; // Basic validation

        const i = r / 100 / 12;
        const months = n * 12;
        
        let invested = P * months;
        let totalValue = (P * (Math.pow(1 + i, months) - 1) * (1 + i)) / i;
        let profit = totalValue - invested;
        
        document.getElementById('sipResult').innerText = "₹" + Math.round(totalValue).toLocaleString();
        
        // Update Chart
        const ctx = document.getElementById('sipChart').getContext('2d');
        if (sipChartInstance) sipChartInstance.destroy();
        
        sipChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Invested Amount', 'Wealth Gained'],
                datasets: [{ 
                    data: [invested, profit], 
                    backgroundColor: ['#0984e3', '#00cec9'], // Pro Colors
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                cutout: '70%',
                plugins: { legend: { position: 'bottom' } }
            }
        });
    };

    // EMI Calculator
    window.calculateEMI = function() {
        const P = parseFloat(document.getElementById('loanP').value);
        const R = parseFloat(document.getElementById('loanR').value) / 12 / 100;
        const N = parseFloat(document.getElementById('loanN').value);
        
        if(P && R && N) {
            const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
            document.getElementById('emiResult').innerText = "₹" + Math.round(emi).toLocaleString();
        }
    };

    // Tax Comparator
    window.compareTax = function() {
        const income = parseFloat(document.getElementById('income').value) || 0;
        
        // Logic: Old Regime (Approx with 80C etc)
        let oldTaxable = income - 200000; // Std Ded (50k) + 80C (1.5L)
        let oldTax = 0;
        if(oldTaxable > 1000000) oldTax += (oldTaxable - 1000000)*0.3 + 112500;
        else if(oldTaxable > 500000) oldTax += (oldTaxable - 500000)*0.2 + 12500;
        if(oldTaxable <= 500000) oldTax = 0; // Rebate

        // Logic: New Regime (FY 25-26)
        let newTaxable = income - 75000; // New Std Ded
        let newTax = 0;
        if(newTaxable > 1500000) newTax += (newTaxable - 1500000)*0.3 + 150000;
        else if(newTaxable > 1200000) newTax += (newTaxable - 1200000)*0.2 + 90000;
        else if(newTaxable > 900000) newTax += (newTaxable - 900000)*0.15 + 45000;
        else if(newTaxable > 700000) newTax += (newTaxable - 300000)*0.05; // Rough slabs
        if(newTaxable <= 1200000) newTax = 0; // 2025 Rebate limit update

        document.getElementById('taxResult').innerHTML = 
            `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div><small>Old Regime</small><br>₹${Math.round(oldTax).toLocaleString()}</div>
                <div style="color:var(--success)"><small>New Regime</small><br>₹${Math.round(newTax).toLocaleString()}</div>
             </div>`;
    };
    
    // Initialize default calculations
    window.calculateSIP();
    window.calculateEMI();
}

// --- PAGE: EXPENSE TRACKER ---
function initTracker() {
    window.addExpense = function() {
        const desc = document.getElementById('desc').value;
        const amount = parseFloat(document.getElementById('amount').value);
        if(desc && amount) {
            let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
            expenses.push({ desc, amount });
            localStorage.setItem('expenses', JSON.stringify(expenses));
            
            // Clear inputs
            document.getElementById('desc').value = '';
            document.getElementById('amount').value = '';
            loadExpenses();
        }
    };

    window.clearExpenses = function() {
        if(confirm("Are you sure you want to delete all expenses?")) {
            localStorage.removeItem('expenses');
            loadExpenses();
        }
    };

    function loadExpenses() {
        let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        let list = document.getElementById('expenseList');
        let total = 0;
        list.innerHTML = '';
        
        expenses.forEach(exp => {
            total += exp.amount;
            list.innerHTML += `
                <li style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid var(--border); align-items:center;">
                    <span style="font-weight:500">${exp.desc}</span> 
                    <b style="color:var(--text)">₹${exp.amount}</b>
                </li>`;
        });
        document.getElementById('totalExpense').innerText = "₹" + total.toLocaleString();
    }
    loadExpenses();
}

// --- PAGE: GAMIFIED QUIZ (Updated) ---
function initQuiz() {
    const questions = [
        { q: "What does SIP stand for?", opts: ["Safe Investment Plan", "Systematic Investment Plan", "Stock Interest Plan"], ans: 1 },
        { q: "Which investment is safest?", opts: ["Crypto", "Govt Bonds", "Lottery"], ans: 1 },
        { q: "Full form of GST?", opts: ["Goods & Service Tax", "Good Sales Tax", "General Tax"], ans: 0 },
        { q: "New Tax Regime tax-free limit?", opts: ["5 Lakhs", "7 Lakhs", "12 Lakhs"], ans: 2 },
        { q: "Does Credit Card use affect CIBIL?", opts: ["No", "Yes, it improves it", "It ruins it"], ans: 1 }
    ];

    let currIndex = 0;
    let score = 0;

    window.loadQuestion = function() {
        const qData = questions[currIndex];
        
        // Update Stats
        document.getElementById('qText').innerText = qData.q;
        document.getElementById('progressText').innerText = `${currIndex + 1} / ${questions.length}`;
        document.getElementById('scoreText').innerText = score;
        
        // Update Progress Bar
        const pct = ((currIndex) / questions.length) * 100;
        document.getElementById('progressBar').style.width = `${pct}%`;

        // Reset UI
        const optsDiv = document.getElementById('opts');
        optsDiv.innerHTML = '';
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('feedback').innerText = '';

        // Generate Buttons
        qData.opts.forEach((opt, i) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-opt-btn'; // Matches new CSS
            btn.innerText = opt;
            btn.onclick = () => checkAnswer(i, btn, qData.ans);
            optsDiv.appendChild(btn);
        });
    };

    window.checkAnswer = function(selectedIndex, btn, correctIndex) {
        // Disable clicks
        document.querySelectorAll('.quiz-opt-btn').forEach(b => b.classList.add('disabled'));

        if(selectedIndex === correctIndex) {
            btn.classList.add('correct');
            document.getElementById('feedback').innerHTML = "<span style='color:var(--success)'>✅ Correct!</span>";
            score++;
            document.getElementById('scoreText').innerText = score;
        } else {
            btn.classList.add('wrong');
            document.getElementById('feedback').innerHTML = "<span style='color:var(--danger)'>❌ Incorrect!</span>";
            // Highlight correct answer
            document.querySelectorAll('.quiz-opt-btn')[correctIndex].classList.add('correct');
        }
        document.getElementById('nextBtn').style.display = 'block';
    };

    window.nextQuestion = function() {
        currIndex++;
        if(currIndex < questions.length) {
            loadQuestion();
        } else {
            showResults();
        }
    };

    function showResults() {
        document.getElementById('quizContent').style.display = 'none';
        document.querySelector('.quiz-header').style.display = 'none';
        document.getElementById('resultScreen').style.display = 'block';
        document.getElementById('progressBar').style.width = '100%';
        
        document.getElementById('finalScore').innerText = score;
        document.getElementById('totalQuestions').innerText = questions.length;
        
        const msg = document.getElementById('resultMessage');
        const emoji = document.getElementById('resultEmoji');

        if(score === questions.length) { emoji.innerText = "🏆"; msg.innerText = "Perfect Score! You are a Pro!"; }
        else if (score > 2) { emoji.innerText = "👏"; msg.innerText = "Great Job! You know your finance."; }
        else { emoji.innerText = "📚"; msg.innerText = "Good try! Keep learning."; }
    }

    window.restartQuiz = function() {
        currIndex = 0; score = 0;
        document.getElementById('resultScreen').style.display = 'none';
        document.getElementById('quizContent').style.display = 'block';
        document.querySelector('.quiz-header').style.display = 'flex';
        loadQuestion();
    };

    // Start
    loadQuestion();
}

// --- PAGE: HOME CHARTS ---
function initHomeCharts() {
    new Chart(document.getElementById('budgetChart'), {
        type: 'doughnut',
        data: {
            labels: ['Interest Payments', 'States Share', 'Schemes', 'Defence', 'Subsidies'],
            datasets: [{ 
                data: [20, 22, 16, 8, 6], 
                backgroundColor: ['#e74c3c', '#3498db', '#1abc9c', '#2c3e50', '#f1c40f'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'right' } }
        }
    });
}