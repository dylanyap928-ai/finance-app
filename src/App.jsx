import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

import { auth, db } from "./firebase";
import AccountCard from "./components/AccountCard";

function App() {
  const money = (value) => Number(value || 0).toFixed(2);

  const defaultAccounts = [
    { title: "Public Bank", amount: 0, icon: "🏦", color: "#0d6efd" },
    { title: "Bank Islam", amount: 0, icon: "🕌", color: "#198754" },
    { title: "Saving", amount: 0, icon: "💰", color: "#fd7e14" },
    { title: "Investment", amount: 0, icon: "📈", color: "#6f42c1" },
  ];

  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [accounts, setAccounts] = useState(defaultAccounts);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeRemarks, setIncomeRemarks] = useState("");
  const [incomeBank, setIncomeBank] = useState("");

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  const provider = new GoogleAuthProvider();

  async function loginGoogle() {
    try {
      setLoading(true);

      const result = await signInWithPopup(auth, provider);
      const loginUser = result.user;
      setUser(loginUser);
setDataLoaded(false);

      const docRef = doc(db, "users", loginUser.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        setAccounts(data.accounts || defaultAccounts);
        setIncomes(data.incomes || []);
        setExpenses(data.expenses || []);
        setDataLoaded(true);
      } else {
        await setDoc(docRef, {
          accounts: defaultAccounts,
          incomes: [],
          expenses: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        setAccounts(defaultAccounts);
        setIncomes([]);
        setExpenses([]);
        setDataLoaded(true);
      }
    } catch (error) {
      console.log(error);
      alert(error.code + "\n" + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setAccounts(defaultAccounts);
    setIncomes([]);
    setExpenses([]);
  }

  useEffect(() => {
  if (!user || !dataLoaded) return;

    async function saveToFirestore() {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            accounts,
            incomes,
            expenses,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        console.log(error);
      }
    }

    saveToFirestore();
  }, [accounts, incomes, expenses, user]);

  function getTodayDate() {
    return new Date().toISOString().split("T")[0];
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-GB");
  }

  function getMonthName(monthValue) {
    return new Date(monthValue + "-01").toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  function getCategoryIcon(category) {
    switch (category) {
      case "Food":
        return "🍔";
      case "Fuel":
        return "⛽";
      case "Healthcare":
        return "🏥";
      case "Shopping":
        return "🛍️";
      case "Entertainment":
        return "🎮";
      case "Bills":
        return "💡";
      default:
        return "📦";
    }
  }

  const monthlyIncomes = incomes.filter((income) =>
    income.date.startsWith(selectedMonth)
  );

  const monthlyExpenses = expenses.filter((expense) =>
    expense.date.startsWith(selectedMonth)
  );

  const totalIncome = monthlyIncomes.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const totalExpenses = monthlyExpenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const remaining = totalIncome - totalExpenses;

  const savingRate =
    totalIncome > 0 ? ((remaining / totalIncome) * 100).toFixed(1) : "0.0";

  const netWorth = accounts.reduce(
    (sum, account) => sum + Number(account.amount),
    0
  );

  const cashAmount = accounts
    .filter((account) => account.title !== "Investment")
    .reduce((sum, account) => sum + Number(account.amount), 0);

  const savingAmount =
    accounts.find((account) => account.title === "Saving")?.amount || 0;

  const investmentAmount =
    accounts.find((account) => account.title === "Investment")?.amount || 0;

  const categoryData = [
    "Food",
    "Fuel",
    "Healthcare",
    "Shopping",
    "Entertainment",
    "Bills",
    "Others",
  ]
    .map((cat) => ({
      category: `${getCategoryIcon(cat)} ${cat}`,
      amount: monthlyExpenses
        .filter((expense) => expense.category === cat)
        .reduce((sum, expense) => sum + Number(expense.amount), 0),
    }))
    .filter((item) => item.amount > 0);

  const pieColors = [
    "#0d6efd",
    "#198754",
    "#fd7e14",
    "#dc3545",
    "#6f42c1",
    "#20c997",
    "#6c757d",
  ];

  function addIncome() {
    if (!user) {
      alert("Please sign in first");
      return;
    }

    if (incomeAmount === "" || incomeBank === "") {
      alert("Please enter income amount and bank");
      return;
    }

    const value = Number(Number(incomeAmount).toFixed(2));

    const newIncome = {
      amount: value,
      remarks: incomeRemarks,
      date: getTodayDate(),
      bank: incomeBank,
    };

    setIncomes([...incomes, newIncome]);

    setAccounts(
      accounts.map((account) =>
        account.title === incomeBank
          ? { ...account, amount: Number((account.amount + value).toFixed(2)) }
          : account
      )
    );

    setIncomeAmount("");
    setIncomeRemarks("");
    setIncomeBank("");
  }

  function addExpense() {
    if (!user) {
      alert("Please sign in first");
      return;
    }

    if (category === "" || amount === "" || selectedBank === "") {
      alert("Please fill in category, amount and bank");
      return;
    }

    const value = Number(Number(amount).toFixed(2));

    const newExpense = {
      category,
      amount: value,
      remarks,
      date: getTodayDate(),
      bank: selectedBank,
    };

    setExpenses([...expenses, newExpense]);

    setAccounts(
      accounts.map((account) =>
        account.title === selectedBank
          ? { ...account, amount: Number((account.amount - value).toFixed(2)) }
          : account
      )
    );

    setCategory("");
    setAmount("");
    setRemarks("");
    setSelectedBank("");
  }

  function deleteIncome(index) {
    const incomeToDelete = incomes[index];

    setIncomes(incomes.filter((_, i) => i !== index));

    setAccounts(
      accounts.map((account) =>
        account.title === incomeToDelete.bank
          ? {
              ...account,
              amount: Number(
                (account.amount - incomeToDelete.amount).toFixed(2)
              ),
            }
          : account
      )
    );
  }

  function deleteExpense(index) {
    const expenseToDelete = expenses[index];

    setExpenses(expenses.filter((_, i) => i !== index));

    setAccounts(
      accounts.map((account) =>
        account.title === expenseToDelete.bank
          ? {
              ...account,
              amount: Number(
                (account.amount + expenseToDelete.amount).toFixed(2)
              ),
            }
          : account
      )
    );
  }

  const allRecords = [
    ...monthlyIncomes.map((item) => ({
      ...item,
      type: "income",
      originalIndex: incomes.indexOf(item),
      label: item.remarks || "Income",
    })),
    ...monthlyExpenses.map((item) => ({
      ...item,
      type: "expense",
      originalIndex: expenses.indexOf(item),
      label: `${getCategoryIcon(item.category)} ${item.category}`,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const inputStyle = {
    width: "100%",
    padding: "13px",
    marginBottom: "12px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    boxSizing: "border-box",
    fontSize: "15px",
  };

  const buttonStyle = {
    width: "100%",
    padding: "13px",
    borderRadius: "12px",
    border: "none",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
  };

  const cardStyle = {
    background: "white",
    padding: "22px",
    borderRadius: "18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginTop: "20px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "20px",
        paddingBottom: "95px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>
        {`
          .app-container {
            max-width: 1100px;
            margin: auto;
          }

          .top-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 18px;
            gap: 10px;
          }

          .account-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .net-small-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
            margin-top: 15px;
          }

          .net-small-box {
            background: rgba(255,255,255,0.18);
            border-radius: 12px;
            padding: 10px 4px;
            text-align: center;
            font-size: 14px;
          }

          .net-small-box strong {
            display: block;
            margin-top: 5px;
            font-size: 16px;
          }

          .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            padding: 9px 2px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            z-index: 999;
          }

          .nav-btn {
            border: none;
            background: none;
            font-size: 12px;
            font-weight: bold;
            color: #666;
            cursor: pointer;
          }

          .nav-btn.active {
            color: #0d6efd;
          }

          @media (max-width: 768px) {
            .top-header {
              flex-direction: column;
              align-items: stretch;
              text-align: center;
            }

            .account-grid {
              grid-template-columns: 1fr 1fr;
            }

            .net-card h1 {
              font-size: 42px !important;
            }

            .net-small-box {
              font-size: 12px;
              padding: 8px 2px;
            }

            .net-small-box strong {
              font-size: 14px;
            }
          }
        `}
      </style>

      <div className="app-container">
        <div className="top-header">
          <h2 style={{ margin: 0 }}>Finance App</h2>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "14px" }}>{user.displayName}</span>

              <button
                onClick={logout}
                style={{
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#dc3545",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={loginGoogle}
              style={{
                padding: "10px 15px",
                border: "none",
                borderRadius: "10px",
                background: "#0d6efd",
                color: "white",
                fontWeight: "bold",
              }}
            >
              {loading ? "Loading..." : "Sign in with Google"}
            </button>
          )}
        </div>

        {page === "dashboard" && (
          <>
            <div
              className="net-card"
              style={{
                background: "linear-gradient(135deg, #0d6efd, #4da3ff)",
                color: "white",
                padding: "24px",
                borderRadius: "22px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0 }}>Net Worth</p>

              <h1 style={{ fontSize: "52px", margin: "10px 0" }}>
                RM {money(netWorth)}
              </h1>

              <div className="net-small-grid">
                <div className="net-small-box">
                  Cash
                  <strong>RM {money(cashAmount)}</strong>
                </div>

                <div className="net-small-box">
                  Saving
                  <strong>RM {money(savingAmount)}</strong>
                </div>

                <div className="net-small-box">
                  Investment
                  <strong>RM {money(investmentAmount)}</strong>
                </div>
              </div>
            </div>

            <div className="account-grid">
              {accounts.map((account) => (
                <AccountCard
                  key={account.title}
                  title={account.title}
                  amount={`RM ${money(account.amount)}`}
                  icon={account.icon}
                  color={account.color}
                />
              ))}
            </div>
          </>
        )}

        {page === "summary" && (
          <div style={cardStyle}>
           <h2
  style={{
    textAlign: "center",
    color: "#1e293b",
    fontWeight: "700",
  }}
>
  Monthly Summary
</h2>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h3>{getMonthName(selectedMonth)}</h3>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                  width: "220px",
                  fontSize: "16px",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                textAlign: "center",
              }}
            >
              <div>
                <p>🟢 Income</p>
                <h3>RM {money(totalIncome)}</h3>
              </div>

              <div>
                <p>🔴 Expenses</p>
                <h3>RM {money(totalExpenses)}</h3>
              </div>

              <div>
                <p>🔵 Remaining</p>
                <h3 style={{ color: remaining >= 0 ? "green" : "red" }}>
                  RM {money(remaining)}
                </h3>
              </div>

              <div>
                <p>🟣 Saving Rate</p>
                <h3>{savingRate}%</h3>
              </div>
            </div>

            <h3 style={{ textAlign: "center", marginTop: "35px" }}>
              Expense Breakdown
            </h3>

            {categoryData.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666" }}>
                No expenses this month.
              </p>
            ) : (
              <div style={{ width: "100%", height: "320px" }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label={({ value }) => `RM ${money(value)}`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip formatter={(value) => `RM ${money(value)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {page === "income" && (
          <div style={cardStyle}>
            <h3 style={{ textAlign: "center" }}>Add Income</h3>

            <select
              value={incomeBank}
              onChange={(e) => setIncomeBank(e.target.value)}
              style={inputStyle}
            >
              <option value="">Deposit To</option>
              {accounts.map((account) => (
                <option key={account.title} value={account.title}>
                  {account.icon} {account.title} (RM {money(account.amount)})
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Remarks (e.g. Salary, Affiliate)"
              value={incomeRemarks}
              onChange={(e) => setIncomeRemarks(e.target.value)}
              style={inputStyle}
            />

            <button
              onClick={addIncome}
              style={{ ...buttonStyle, background: "#198754" }}
            >
              Add Income
            </button>

            <h3 style={{ textAlign: "center", marginTop: "30px" }}>
              Income Records
            </h3>

            {monthlyIncomes.length === 0 && <p>No income records.</p>}

            {[...monthlyIncomes].reverse().map((income) => (
              <div
                key={`${income.date}-${income.amount}-${income.remarks}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eee",
                  padding: "12px 0",
                }}
              >
                <div>
                  <small>{formatDate(income.date)}</small>
                  <br />
                  <strong>{income.remarks || "Income"}</strong>
                  <br />
                  <span>Deposit to: {income.bank}</span>
                  <br />
                  <strong style={{ color: "green" }}>
                    + RM {money(income.amount)}
                  </strong>
                </div>

                <button
                  onClick={() => deleteIncome(incomes.indexOf(income))}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 12px",
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        {page === "expenses" && (
          <div style={cardStyle}>
            <h3 style={{ textAlign: "center" }}>Add Expense</h3>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select Category</option>
              <option value="Food">🍔 Food</option>
              <option value="Fuel">⛽ Fuel</option>
              <option value="Healthcare">🏥 Healthcare</option>
              <option value="Shopping">🛍️ Shopping</option>
              <option value="Entertainment">🎮 Entertainment</option>
              <option value="Bills">💡 Bills</option>
              <option value="Others">📦 Others</option>
            </select>

            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              style={inputStyle}
            >
              <option value="">Pay From</option>
              {accounts.map((account) => (
                <option key={account.title} value={account.title}>
                  {account.icon} {account.title} (RM {money(account.amount)})
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Remarks (e.g. McDonald's, Shell)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={inputStyle}
            />

            <button
              onClick={addExpense}
              style={{ ...buttonStyle, background: "#0d6efd" }}
            >
              Add Expense
            </button>

            <h3 style={{ textAlign: "center", marginTop: "30px" }}>
              Expense Records
            </h3>

            {monthlyExpenses.length === 0 && <p>No expense records.</p>}

            {[...monthlyExpenses].reverse().map((expense) => (
              <div
                key={`${expense.date}-${expense.amount}-${expense.remarks}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eee",
                  padding: "12px 0",
                }}
              >
                <div>
                  <small>{formatDate(expense.date)}</small>
                  <br />
                  <strong>
                    {getCategoryIcon(expense.category)} {expense.category}
                  </strong>
                  <br />
                  <span>{expense.remarks || "No remarks"}</span>
                  <br />
                  <span>Paid from: {expense.bank}</span>
                  <br />
                  <strong style={{ color: "red" }}>
                    - RM {money(expense.amount)}
                  </strong>
                </div>

                <button
                  onClick={() => deleteExpense(expenses.indexOf(expense))}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 12px",
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        {page === "records" && (
          <div style={cardStyle}>
            <h2
  style={{
    textAlign: "center",
    color: "#1e293b",
    fontWeight: "700",
  }}
>
  All Records
</h2>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h3>{getMonthName(selectedMonth)}</h3>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                  width: "220px",
                  fontSize: "16px",
                }}
              />
            </div>

            {allRecords.length === 0 && <p>No records this month.</p>}

            {allRecords.map((record) => (
              <div
                key={`${record.type}-${record.date}-${record.amount}-${record.label}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eee",
                  padding: "12px 0",
                }}
              >
                <div>
                  <small>{formatDate(record.date)}</small>
                  <br />
                  <strong>{record.label}</strong>
                  <br />
                  <span>{record.bank}</span>
                  <br />
                  <strong
                    style={{
                      color: record.type === "income" ? "green" : "red",
                    }}
                  >
                    {record.type === "income" ? "+" : "-"} RM{" "}
                    {money(record.amount)}
                  </strong>
                </div>

                <button
                  onClick={() =>
                    record.type === "income"
                      ? deleteIncome(record.originalIndex)
                      : deleteExpense(record.originalIndex)
                  }
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 12px",
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <button
          className={page === "dashboard" ? "nav-btn active" : "nav-btn"}
          onClick={() => setPage("dashboard")}
        >
          🏠
          <br />
          Home
        </button>

        <button
          className={page === "summary" ? "nav-btn active" : "nav-btn"}
          onClick={() => setPage("summary")}
        >
          📊
          <br />
          Summary
        </button>

        <button
          className={page === "income" ? "nav-btn active" : "nav-btn"}
          onClick={() => setPage("income")}
        >
          ➕
          <br />
          Income
        </button>

        <button
          className={page === "expenses" ? "nav-btn active" : "nav-btn"}
          onClick={() => setPage("expenses")}
        >
          💸
          <br />
          Expense
        </button>

        <button
          className={page === "records" ? "nav-btn active" : "nav-btn"}
          onClick={() => setPage("records")}
        >
          📋
          <br />
          Records
        </button>
      </div>
    </div>
  );
}

export default App;