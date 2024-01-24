const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const port = 3000;
const fs = require("fs");
const { scryptSync, randomBytes, timingSafeEqual, scrypt } = require("crypto");

app.use(cookieParser());

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item, priority) {
    let added = false;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority < priority) {
        this.items.splice(i, 0, { item, priority });
        added = true;
        break;
      }
    }
    if (!added) {
      this.items.push({ item, priority });
    }
  }

  dequeue() {
    return this.items.shift().item;
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

const searchList = require(`./database/search.json`);

app.get(`/search`, async (req, res) => {
  const token = req.cookies.token;
  console.log(token);
  const data = fs.readFileSync("src/database/users.json");
  const jsonData = JSON.parse(data);
  if (jsonData.some((u) => u.token === token)) {
    try {
      try {
        const searchQuery = req.query;
        const filteredSearch = searchList.filter((info) => {
          let isValid = true;
          for (key in searchQuery) {
            if (Array.isArray(info[key])) {
              isValid =
                isValid &&
                info[key].some((value) =>
                  searchQuery[key].includes(value.toLowerCase())
                );
            } else {
              isValid = isValid && info[key] === searchQuery[key];
            }
          }
          return isValid;
        });

        const priorityQueue = new PriorityQueue();
        filteredSearch.forEach((result) => {
          const priority = calculatePriority(result, searchQuery);
          priorityQueue.enqueue(result, priority);
        });

        const searchResults = [];
        while (!priorityQueue.isEmpty()) {
          searchResults.push(priorityQueue.dequeue());
        }

        const fuzzyResults = fuzzySearch(
          searchList,
          searchQuery[key].toLowerCase()
        );
        console.log(fuzzyResults);

        res.json({ data: fuzzyResults });
      } catch (err) {
        res.send(err);
      }
    } catch (err) {
      res.send("You were not logged in");
      console.log(err);
    }
  } else {
    res.send(`You are not logged in. Use /user/login to login`);
  }
});

app.post(`/user/signup`, (req, res) => {
  const { name, email } = req.query;
  const data = fs.readFileSync("src/database/users.json");
  const jsonData = JSON.parse(data);
  if (!email.includes("@")) {
    res.send(`Invalid email address`);
  } else if (jsonData.some((user) => user.email === email)) {
    res.send(`User is already signed up`);
  } else if (jsonData.some((user) => user.username === name)) {
    res.send(`This name is already taken`);
  } else {
    const salt = randomBytes(16).toString("hex");
    const hashedToken = scryptSync(name, salt, 16).toString("hex");
    jsonData.push({ token: `${salt}:${hashedToken}`, email: email });
    const updatedData = JSON.stringify(jsonData, null, 2);
    fs.writeFileSync("src/database/users.json", updatedData);

    res.send(
      `User successfully signed up with email: ${email}\n\n${salt}:${hashedToken} - This is your token, guard it safely, you can use it to login. If you lose it, your account is gone.`
    );
    res.cookie("token", token, { httpOnly: true, secure: true });
  }
});

app.post(`/user/login`, (req, res) => {
  const { token, email } = req.query;
  const data = fs.readFileSync("src/database/users.json");
  const jsonData = JSON.parse(data);
  const user = jsonData.find((u) => u.email === email);
  console.log(user.email);
  if (user) {
    console.log(user.token);
    if (token) {
      if (jsonData.some((user) => user.email === email)) {
        if (jsonData.some((user) => user.token === token)) {
          try {
            res.cookie("token", token, { httpOnly: true, secure: true });
            res.send(`You are now logged in`);
          } catch (err) {
            res.send("There was an error");
            console.log(err);
          }
        }
      }
    } else {
      res.send(`Token not found for the user`);
    }
  } else {
    res.send(`User not found`);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function calculatePriority(result, searchQuery) {
  let priority = 0;
  for (key in searchQuery) {
    if (Array.isArray(result[key])) {
      priority += result[key].filter((value) =>
        searchQuery[key].includes(value)
      ).length;
    } else {
      priority += result[key] === searchQuery[key] ? 1 : 0;
    }
  }
  return priority;
}

function fuzzySearch(data, query) {
  const threshold = 1; 
  const results = data.filter((item) => {
    const similarity = calculateSimilarity(item[key], query);
    const includesQuery = item[key].toLowerCase().includes(query.toLowerCase());
    const isSimilar = similarity > threshold;
    return includesQuery || isSimilar;
  });

  return results;
}

function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  );

  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0) {
        dp[i][j] = j;
      } else if (j === 0) {
        dp[i][j] = i;
      } else if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}