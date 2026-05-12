let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentType = 'income';
let currentFilter = 'all';
let budget = parseFloat(localStorage.getItem('budget')) || 0;

const categoryEmojis = {
  salary: '💼', freelance: '💻', gift: '🎁', investment: '📈',
  'other-income': '💰', food: '🍔', transport: '🚗', bills: '💡',
  shopping: '🛍️', health: '🏥', entertainment: '🎬',
  education: '📚', 'other-expense': '💸'
};

const categoryColors = [
  '#6C63FF', '#FF6584', '#00C896', '#FFD93D',
  '#FF9F43', '#54A0FF', '#5F27CD', '#00D2D3'
];

function setType(type) {
  currentType = type;
  document.getElementById('btn-income').classList.remove('active');
  document.getElementById('btn-expense').classList.remove('active');
  document.getElementById(`btn-${type}`).classList.add('active');
}

function toggleBudget() {
  const input = document.getElementById('budget-input');
  input.style.display = input.style.display === 'none' ? 'flex' : 'none';
}

function setBudget() {
  const val = parseFloat(document.getElementById('budget-amount').value);
  if (!val || val <= 0) { alert('Enter a valid budget!'); return; }
  budget = val;
  localStorage.setItem('budget', budget);
  document.getElementById('budget-input').style.display = 'none';
  document.getElementById('budget-amount').value = '';
  updateUI();
}

function addTransaction() {
  const desc = document.getElementById('desc').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;

  if (!desc || isNaN(amount) || amount <= 0) {
    alert('Please enter a valid description and amount!');
    return;
  }

  const transaction = {
    id: Date.now(),
    desc,
    amount,
    type: currentType,
    category: category || (currentType === 'income' ? 'other-income' : 'other-expense'),
    date: new Date().toLocaleDateString()
  };

  transactions.push(transaction);
  saveAndUpdate();

  document.getElementById('desc').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('category').value = '';
}

function deleteTransaction(id) {
  if (confirm('Delete this transaction?')) {
    transactions = transactions.filter(t => t.id !== id);
    saveAndUpdate();
  }
}

function filterTransactions(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  updateUI();
}

function saveAndUpdate() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  updateUI();
}

function updateUI() {
  const income = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const balance = income - expense;

  document.getElementById('balance').textContent = `₦${balance.toLocaleString('en-NG', {minimumFractionDigits: 2})}`;
  document.getElementById('total-income').textContent = `₦${income.toLocaleString('en-NG', {minimumFractionDigits: 2})}`;
  document.getElementById('total-expense').textContent = `₦${expense.toLocaleString('en-NG', {minimumFractionDigits: 2})}`;

  // Balance bar
  if (income > 0) {
    const percentage = Math.min((expense / income) * 100, 100);
    document.getElementById('bar-fill').style.width = `${percentage}%`;
    document.getElementById('bar-label').textContent = `${percentage.toFixed(0)}% of income spent`;
  }

  // Budget status
  updateBudgetStatus(expense);

  // Breakdown
  updateBreakdown();

  // Transaction list
  updateTransactionList();
}

function updateBudgetStatus(expense) {
  const statusEl = document.getElementById('budget-status');
  if (!budget) { statusEl.innerHTML = '<p style="color:#666;font-size:0.8rem;">No budget set</p>'; return; }

  const percentage = (expense / budget) * 100;
  let cls, msg;

  if (percentage < 70) {
    cls = 'safe';
    msg = `✅ You've spent ₦${expense.toLocaleString()} of ₦${budget.toLocaleString()} budget (${percentage.toFixed(0)}%)`;
  } else if (percentage < 100) {
    cls = 'warning';
    msg = `⚠️ Warning! You've spent ${percentage.toFixed(0)}% of your budget!`;
  } else {
    cls = 'danger';
    msg = `🚨 Over budget! You've exceeded your ₦${budget.toLocaleString()} limit!`;
  }

  statusEl.innerHTML = `<div class="budget-alert ${cls}">${msg}</div>`;
}

function updateBreakdown() {
  const breakdownEl = document.getElementById('breakdown-list');
  const expenses = transactions.filter(t => t.type === 'expense');

  if (expenses.length === 0) {
    breakdownEl.innerHTML = '<p class="empty-breakdown">No expenses yet 💸</p>';
    return;
  }

  const categoryTotals = {};
  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  breakdownEl.innerHTML = sorted.map(([cat, amt], i) => {
    const pct = ((amt / total) * 100).toFixed(0);
    const color = categoryColors[i % categoryColors.length];
    const emoji = categoryEmojis[cat] || '💸';
    return `
      <div class="breakdown-item">
        <div class="breakdown-label">
          <span>${emoji} ${cat.replace('-', ' ')}</span>
          <span>₦${amt.toLocaleString()} (${pct}%)</span>
        </div>
        <div class="breakdown-bar-bg">
          <div class="breakdown-bar" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function updateTransactionList() {
  const list = document.getElementById('transaction-list');
  let filtered = currentFilter === 'all' ? transactions : transactions.filter(t => t.type === currentFilter);

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-msg">No transactions yet! Add one above 💰</p>';
    return;
  }

  list.innerHTML = filtered.slice().reverse().map(t => {
    const emoji = categoryEmojis[t.category] || '💰';
    return `
      <li class="transaction-item ${t.type}">
        <div class="transaction-left">
          <div class="transaction-emoji">${emoji}</div>
          <div>
            <div class="desc">${t.desc}</div>
            <div class="category-tag">${t.category?.replace('-', ' ') || t.type}</div>
            <div class="date">${t.date}</div>
          </div>
        </div>
        <div class="transaction-right">
          <span class="amount">${t.type === 'income' ? '+' : '-'}₦${t.amount.toLocaleString()}</span>
          <button class="delete-btn" onclick="deleteTransaction(${t.id})">🗑️</button>
        </div>
      </li>
    `;
  }).join('');
}

function exportCSV() {
  if (transactions.length === 0) { alert('No transactions to export!'); return; }
  const headers = 'Description,Amount,Type,Category,Date\n';
  const rows = transactions.map(t => `${t.desc},${t.amount},${t.type},${t.category},${t.date}`).join('\n');
  const blob = new Blob([headers + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expenses.csv';
  a.click();
}

updateUI();