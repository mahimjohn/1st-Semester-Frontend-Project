const data = JSON.parse(localStorage.getItem("lastQuizResult") || "{}");

const percentEl = document.getElementById("final-percent");
const text2El = document.getElementById("text2");
const resultMsgEl = document.querySelector(".result-message");
const inspireEl = document.getElementById("inspire-msg");
const homeBtn = document.getElementById("return-home");

// If result exists, fill UI
if (data && typeof data.percent !== "undefined") {
    percentEl.textContent = data.percent + "%";
    text2El.textContent = `${data.score} Out Of ${data.total}`;

    // MAIN MESSAGE
    if (data.percent >= 80) {
        resultMsgEl.textContent = "Excellent!";
    } else if (data.percent >= 60) {
        resultMsgEl.textContent = "Success";
    } else {
        resultMsgEl.textContent = "Keep Trying";
    }

    // INSPIRATIONAL QUOTE
    const quotes = [
        "Every step forward makes you stronger.",
        "Great achievements begin with small efforts.",
        "You're improving — keep pushing!",
        "Success is built one answer at a time.",
        "Believe in yourself — you're capable of more!"
    ];
    inspireEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

// HOME BUTTON
if (homeBtn) {
    homeBtn.addEventListener("click", () => {
        window.location.href = 'FrontEnd_Assignment.html';   // change if page name differs
    });
}
