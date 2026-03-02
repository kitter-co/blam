let apiPassword = localStorage.getItem("api-password")
let users = null, usersLoaded = null

async function loadUsers() {
  let resolve
  ({ promise: usersLoaded, resolve } = Promise.withResolvers())

  const res = await fetch(`${API_URL}/users/`, {
    headers: { "api-auth": apiPassword },
  })
  users = await res.json()
  document.getElementById("users-table-body").innerHTML = ""

  for (let u of users) {
    let tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${getUserById(u.target) ?? "—"}</td>
      <td>${u.email.replace("@", "<wbr>@")}</td>
      <td><div class="status ${u.alive ? "alive" : "dead"}"></div></td>
      <td><button class="remove-btn" onclick="removeUser('${u._id}')">Remove<i class="ph ph-backspace"></i></button></td>
      <td><button class="revive-btn" onclick="reviveUser('${u._id}')">Revive<i class="ph ph-pulse"></i></button></td>
    `
    document.getElementById("users-table-body").append(tr)
  }

  resolve()
}

async function loadReports() {
  const res = await fetch(`${API_URL}/reports/`, {
    headers: { "api-auth": apiPassword },
  })
  const reports = await res.json()
  await usersLoaded

  console.log(reports)
  document.getElementById("requests").innerHTML = ""
  for (let r of reports) {
    if (!r.active) continue
    let li = document.createElement("li")
    li.innerHTML = `<span>${getUserById(r.user)} <span style="color: var(--gray);">eliminated</span> ${getUserById(r.target)}</span>
      <button class="accept" onclick="blammoUser('${r.user}', '${r._id}')">Accept<i class="ph ph-check"></i></button>
      <button class="reject" onclick="completeReport('${r._id}')">Reject<i class="ph ph-x"></i></button>`
    document.getElementById("requests").append(li)
  }

  while (true) {
    if (Date.now() % 1000 == 0) {
      id("reload-blam-requests").classList.remove("spinning")
      break
    }
  }
}

id("reload-blam-requests").onclick = () => {
  id("reload-blam-requests").classList.add("spinning")
  loadReports()
}

function getUserById(id) {
  return users?.find((u) => u._id === id)?.name
}
async function blammoUser(user, report) {
  await fetch("https://blam.rkmr.dev/api/blammo/", {
    method: "POST",
    headers: { "api-auth": apiPassword, "Content-Type": "application/json" },
    body: JSON.stringify({ user: user }),
  })
  completeReport(report)
  loadUsers()
  loadReports()
}
async function completeReport(report) {
  await fetch("https://blam.rkmr.dev/api/reports/complete", {
    method: "POST",
    headers: { "api-auth": apiPassword, "Content-Type": "application/json" },
    body: JSON.stringify({ id: report }),
  })

  loadUsers()
  loadReports()
}
async function randomize() {
  await fetch(`${API_URL}/assign-targets/`, {
    method: "POST",
    headers: { "api-auth": apiPassword },
  })
  loadUsers()
}

async function addUser() {
  const name = document.getElementById("add-name").value.trim()
  const email = document.getElementById("add-email").value.trim()
  const grade = document.getElementById("add-grade").value.trim()
  const errorEl = document.getElementById("add-error")
  errorEl.style.display = "none"

  if (!name || !email || !grade) {
    errorEl.textContent = "All fields are required."
    errorEl.style.display = "inline"
    return
  }

  const res = await fetch("https://blam.rkmr.dev/api/users/add", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-auth": apiPassword },
    body: JSON.stringify({ name, email, grade }),
  })

  if (res.ok) {
    document.getElementById("add-name").value = ""
    document.getElementById("add-email").value = ""
    document.getElementById("add-grade").value = ""
    loadUsers()
  } else {
    errorEl.textContent = `error (${res.status})`
    errorEl.style.display = "inline"
  }
}

async function removeUser(id) {
  const res = await fetch(`https://blam.rkmr.dev/api/users/${id}`, {
    method: "DELETE",
    headers: { "api-auth": apiPassword },
  })
  if (res.ok) {
    loadUsers()
  } else {
    alert(`Failed to remove user (${res.status})`)
  }
}

const passwordInput = document.getElementById("password-input")

async function attemptLogin(password) {
  const errorEl = document.getElementById("auth-error")
  errorEl.style.display = "none"
  let res
  try {
    res = await fetch(`${API_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-auth": password },
    })
  } catch (e) {
    errorEl.textContent = e
    errorEl.style.display = "inline"
    return
  }
  if (res.ok) {
    apiPassword = password
    localStorage.setItem("api-password", password)
    document.getElementById("auth").style.display = "none"
    document.getElementById("main-content").style.display = "flex"
    loadUsers()
    loadReports()
  } else if (res.status === 401) {
    document.getElementById("auth").style.display = "none"
    document.getElementById("unauthorized-msg").style.display = "block"
  } else {
    errorEl.textContent = `error (${res.status})`
    errorEl.style.display = "inline"
  }
}

document.getElementById("login-btn").addEventListener("click", () => attemptLogin(passwordInput.value))
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") attemptLogin(passwordInput.value)
})

if (apiPassword) attemptLogin(apiPassword) // from localStorage

onload = () => {
  document.getElementById("password-input").focus()
}

document.getElementById("fake-file-input").onclick = () => {
  document.getElementById("csv").click()
}

/*

{
    "fields": [
        "Timestamp",
        "Email Address",
        "First and last name",
        "grade",
        "blammo?",
        null
    ],
    "records": [
        [
            "2/27/2026 15:38:44",
            "test@example.com",
            "Name 1",
            9,
            "yes",
            null
        ],
        [
            "2/27/2026 15:38:55",
            "e@mail.co",
            "Name 2",
            10,
            "yes",
            null
        ],
        [
            "2/27/2026 15:39:07",
            "cheese@cheese.com",
            "Name 3",
            11,
            "yes",
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            ""
        ]
    ],
    "useMemoryStore": true,
    "metadata": {
        "filename": "test form stuff - Form Responses 1.csv"
    }
}

*/

let columnHeaders = {}

function dragstartHandler(e) {
  console.log(e, e.target, e.target.id)
  e.dataTransfer.setData("text", e.target.id)
  id("drop-headers").classList.add("hovered")
}

function dragoverHandler(e) {
  e.preventDefault()
}

function dragendHandler() {
  id("drop-headers").classList.remove("hovered")
}

function dropHandler(e) {
  e.preventDefault()
  let data = e.dataTransfer.getData("text")
  if ([...e.target.classList].includes("csv-column-header")) {
    if (e.target.querySelector(".csv-header-chip")) {
      columnHeaders[e.target.querySelector(".csv-header-chip").innerText.toLowerCase()] = null
      id("csv-headers").append(e.target.querySelector(".csv-header-chip"))
    }
    e.target.appendChild(document.getElementById(data))
    columnHeaders[e.target.querySelector(".csv-header-chip").innerText.toLowerCase()] = parseInt(e.target.getAttribute("column"))

    if (columnHeaders.name && columnHeaders.grade && columnHeaders.email) {
      id("import").disabled = false
    } else {
      id("import").disabled = true
    }
  }

  id("drop-headers").classList.remove("hovered")
}

let csvData

id("csv").onchange = e => {
  CSV.fetch({
    file: e.target.files[0]
    }
  ).then(data => {
    console.log(data)

    csvData = data

    let headers = [
      "Name",
      "Email",
      "Grade"
    ]

    for (let i = 0; i < headers.length; i++) {
      let h = headers[i]
      let headerChip = document.createElement("div")
      headerChip.innerText = h
      headerChip.classList.add("csv-header-chip")
      headerChip.style.setProperty("--color", `hsl(${(360 / headers.length) * i}, 100%, 59%)`)
      headerChip.draggable = true
      headerChip.setAttribute("ondragstart", "dragstartHandler(event)")
      headerChip.setAttribute("ondragend", "dragendHandler()")
      headerChip.id = `header-chip-${i}`
      id("csv-headers").append(headerChip)
    }

    id("csv-table").innerHTML = ""
    let row = document.createElement("tr")
    row.id = "drop-headers"
    for (let i = 0; i < data.fields.length; i++) {
      row.innerHTML += `<td class="csv-column-header" ondrop="dropHandler(event)" ondragover="dragoverHandler(event)" column="${i}"></td>`
    }
    id("csv-table").append(row)

    let header = document.createElement("tr")
    for (let f of data.fields) {
      header.innerHTML += `<td>${f}</td>`
    }
    id("csv-table").append(header)

    id("csv-name").innerText = data.metadata.filename
    for (let row of data.records) {
      let tr = document.createElement("tr")
      if (row.every(e => e == null)) continue
      for (let cell of row) {
        let td = document.createElement("td")
        td.innerText = cell
        tr.append(td)
      }
      id("csv-table").append(tr)
    }
  })
}

id("import").onclick = () => {
  id("import").classList.remove("loading")
  if (!columnHeaders.name || !columnHeaders.grade || !columnHeaders.email) {
    console.error("Import error!")
    return
  }
  
  id("csv-table-wrapper").classList.add("disabled")

  let data = []
  for (let r of csvData.records) {
    data.push({
      name: r[columnHeaders.name],
      email:r[columnHeaders.email],
      grade:r[columnHeaders.grade],
    })
  }

  console.log(data)

  id("import").disabled = true
  id("import").classList.add("loading")
}
