const LIMIT_WARNING = 500000;
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let myChart = null;

const form = document.getElementById('expense-form');
const itemNameInput = document.getElementById('item-name');
const itemAmountInput = document.getElementById('item-amount');
const itemCategoryInput = document.getElementById('item-category');
const transactionsList = document.getElementById('transactions-list');
const totalBalanceEl = document.getElementById('total-balance');
const limitWarningEl = document.getElementById('limit-warning');
const sortSelect = document.getElementById('sort-select');
const themeToggleBtn = document.getElementById('theme-toggle');

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
};

form.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const transaction = {
    id: generateID(),
    name: itemNameInput.value,
    amount: parseFloat(itemAmountInput.value),
    category: itemCategoryInput.value,
    date: new Date().getTime()
  };

  transactions.push(transaction);
  updateLocalStorage();
  updateUI();
  
  itemNameInput.value = '';
  itemAmountInput.value = '';
  itemCategoryInput.value = '';
});

const generateID = () => Math.floor(Math.random() * 1000000000);

const deleteTransaction = (id) => {
  transactions = transactions.filter(transaction => transaction.id !== id);
  updateLocalStorage();
  updateUI();
};

const renderTransactions = () => {
  transactionsList.innerHTML = '';
  
  let sortedTransactions = [...transactions];
  const sortValue = sortSelect.value;
  
  if (sortValue === 'newest') sortedTransactions.sort((a, b) => b.date - a.date);
  else if (sortValue === 'highest') sortedTransactions.sort((a, b) => b.amount - a.amount);
  else if (sortValue === 'lowest') sortedTransactions.sort((a, b) => a.amount - b.amount);
  else if (sortValue === 'category') sortedTransactions.sort((a, b) => a.category.localeCompare(b.category));

  if (sortedTransactions.length === 0) {
    transactionsList.innerHTML = '<p style="text-align:center; padding: 20px; color: gray;">No transactions yet.</p>';
    return;
  }

  sortedTransactions.forEach(t => {
    const div = document.createElement('div');
    div.classList.add('transaction-item');
    div.innerHTML = `
      <div class="transaction-info">
        <h4>${t.name}</h4>
        <span>${t.category}</span>
      </div>
      <div>
        <span class="transaction-amount">${formatRupiah(t.amount)}</span>
        <button class="btn-delete" onclick="deleteTransaction(${t.id})">Delete</button>
      </div>
    `;
    transactionsList.appendChild(div);
  });
};

sortSelect.addEventListener('change', renderTransactions);

const updateBalanceAndWarning = () => {
  const total = transactions.reduce((acc, t) => acc + t.amount, 0);
  totalBalanceEl.innerText = formatRupiah(total);

  const categoryTotals = { Food: 0, Transport: 0, Fun: 0 };
  transactions.forEach(t => { categoryTotals[t.category] += t.amount; });

  let warnings = [];
  for (const cat in categoryTotals) {
    if (categoryTotals[cat] > LIMIT_WARNING) {
      warnings.push(`<b>${cat}</b> expense has exceeded ${formatRupiah(LIMIT_WARNING)}`);
    }
  }

  if (warnings.length > 0) {
    limitWarningEl.innerHTML = '⚠ ' + warnings.join('<br>⚠ ');
    limitWarningEl.classList.remove('hidden');
  } else {
    limitWarningEl.classList.add('hidden');
  }
};

const updateChart = () => {
  const ctx = document.getElementById('expense-chart').getContext('2d');
  
  const categoryTotals = { Food: 0, Transport: 0, Fun: 0 };
  transactions.forEach(t => { categoryTotals[t.category] += t.amount; });

  if (myChart) { myChart.destroy(); }

  const textColor = document.body.classList.contains('dark-theme') || document.documentElement.getAttribute('data-theme') === 'dark' ? '#e0e0e0' : '#333';

  myChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Food', 'Transport', 'Fun'],
      datasets: [{
        data: [categoryTotals.Food, categoryTotals.Transport, categoryTotals.Fun],
        backgroundColor: ['#ff6384', '#36a2eb', '#ffce56'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: textColor } }
      }
    }
  });
};

const toggleTheme = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    themeToggleBtn.innerText = '🌙';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    themeToggleBtn.innerText = '☀️';
  }
  updateChart();
};

themeToggleBtn.addEventListener('click', toggleTheme);

const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggleBtn.innerText = '☀️';
  }
};

const updateLocalStorage = () => {
  localStorage.setItem('transactions', JSON.stringify(transactions));
};

const updateUI = () => {
  renderTransactions();
  updateBalanceAndWarning();
  updateChart();
};

initTheme();
updateUI();