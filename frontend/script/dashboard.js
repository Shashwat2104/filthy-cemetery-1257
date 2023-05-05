const baseURL = 'http://localhost:8080';

const token = sessionStorage.getItem("token") || null;

if(!token){
    alert("Please Login");
}

const socket = io(baseURL, {
    transports: ['websocket'],
    query: {
        token: token,
        oauthEmail: "fromLocalStorage"
    }
});

// handling the errors
socket.on('connect_error', (error) => {
    if (error.message === 'invalid token' || error.message === 'jwt expired') {
        console.log(error.message);
        alert(`Please Login`)
    }
    else {
        console.log(error);
        alert(`Something went wrong`);
    }
});

const budgetBtn = document.getElementById('add-budget');
const budgetInput = document.getElementById('d-budget');
const expenseName = document.getElementById('expense-title');
const expenseAmt = document.getElementById('expense-amout');
const expenseBtn = document.getElementById('add-expense');
const displayBudget = document.getElementById('budget-amount-input');
const displayExpense = document.getElementById('expense-amount-input');
const displayBalance = document.getElementById('balance-amount-input');
const historyContainer = document.getElementById('recent-expenses-history');


// Default Budget
socket.on("defaultBudget", (data) => {
    if (data) {
        data = JSON.parse(data);

        // Displaying the Stats
        displayStats(data);

        if (!data.transactions[0]) {
            emptyRecentHistory();
        }
        else {
            showRecentHistory(data.transactions)
        }
    }
    else {
        alert("No Data")
    }

})


// Sending budget amount
budgetBtn.addEventListener('click', () => {

    if(!token) return alert("Please Login")

    let budgetamt = +(budgetInput.value)
    console.log(budgetamt)
    if (!budgetamt) return alert("Please Provide Budget")
    socket.emit("budgetAmt", budgetamt);
    budgetInput.value = null
})


// getting the updated data
socket.on('updatedBudget', (data) => {
    const updatedBudget = JSON.parse(data);
    console.log(updatedBudget)

    // Displaying the Stats
    displayStats(updatedBudget)

    if (!updatedBudget.transactions[0]) {
        emptyRecentHistory();
    }
    else {
        showRecentHistory(updatedBudget.transactions)
    }
});


// Sending the expenses
expenseBtn.addEventListener('click', () => {

    if(!token) return alert("Please Login")

    if (!expenseName.value || !expenseAmt.value) return alert("Please Provide Required fields")

    let expenses = {
        transactionDetails: {
            name: expenseName.value,
            amount: +(expenseAmt.value)
        },
        expenseAmt: +(expenseAmt.value)
    }

    console.log(expenses)
    socket.emit("expenses", JSON.stringify(expenses));
    expenseName.value = null;
    expenseAmt.value = null;
})


// Getting the Updated Expenses
socket.on('expenseDeduct', (data) => {
    const updatedExpense = JSON.parse(data);

    // Displaying the Stats
    displayStats(updatedExpense);

    // Display Transactions 
    if (!updatedExpense.transactions[0]) {
        emptyRecentHistory();
    }
    else {
        showRecentHistory(updatedExpense.transactions)
    }

    // Checking if the expenses > budget
    if (updatedExpense.balance < 0) {
        alert("Your expenses are exceeding your budget goals")
    }
    console.log(updatedExpense);
});


// Getting the Updated expenses history
socket.on('updatedExpenses', (data)=>{
    const updatedHistory = JSON.parse(data);

    console.log(updatedHistory);

    // Displaying the Stats
    displayStats(updatedHistory);

    // Display Transactions 
    if (!updatedHistory.transactions[0]) {
        emptyRecentHistory();
    }
    else {
        showRecentHistory(updatedHistory.transactions)
    }
})


// FUNCTIONS TO DISPLAY STATS
function displayStats(data) {
    displayBudget.innerText = data.budget;
    displayExpense.innerText = data.expenses
    displayBalance.innerText = data.balance
}

function emptyRecentHistory() {
    historyContainer.innerHTML = null;
    let tr = document.createElement('tr');
    let noData = document.createElement('td');
    noData.setAttribute('class', "data-null");
    noData.setAttribute("colspan", 3);
    noData.innerText = "No Recent Transactions";
    tr.append(noData);
    historyContainer.append(tr);
}

function showRecentHistory(data) {
    historyContainer.innerHTML = null; // 
    data.forEach((ele, i) => {

        let tr = document.createElement('tr');
        let name = document.createElement('td');
        name.innerText = ele.name;
        let amount = document.createElement('td');
        amount.innerText = ele.amount;
        let remove = document.createElement('td');
        let deleteIcon = document.createElement('img');
        deleteIcon.setAttribute('src', "./images/delete-svgrepo-com.png")

        deleteIcon.addEventListener('click', () => {

            if (!data[0]) return emptyRecentHistory();

            let filtered = data.filter((element, index) => {
                if (i === index) return false;
                return true;
            });

            // console.log(ele.amount)

            // Sending Updated transactions
            socket.emit("removeExpenses",JSON.stringify({filtered, amt:ele.amount}));

        })

        remove.append(deleteIcon);

        tr.append(name, amount, remove);

        historyContainer.append(tr);
    })
}
