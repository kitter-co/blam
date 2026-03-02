async function loadLeaderboard() {
  const res = await fetch(`${API_URL}/leaderboard`)
  const users = await res.json()

  users.sort((a, b) => b.score - a.score)

  const tbody = document.querySelector("#leaderboard tbody")
  tbody.innerHTML = ""

  const rankClasses = ["gold", "silver", "bronze"]

  users.forEach((user, index) => {
    const rankClass = rankClasses[index] ?? ""
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td><div class="rank ${rankClass}">${index + 1}</div></td>
      <td>${user.name}</td>
      <td>${user.grade}</td>
      <td>${user.score}</td>
      <td><div class="status ${user.alive ? "alive" : "dead"}"></div></td>
    `
    tbody.appendChild(tr)
  })
}

loadLeaderboard()
