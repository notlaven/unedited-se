const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const port = 3000;
const fs = require("fs");
const { scryptSync, randomBytes, timingSafeEqual, scrypt } = require("crypto");
const path = require('path');

const process = require("node:process");

const filename = null;

function logError(error) {
  if (filename != null) {
    if (!fs.existsSync(filename)) fs.writeFileSync(filename, "");
    fs.appendFileSync(filename, error + "\n");
  }
}

function logError(error, origin) {
  if (filename != null) {
    if (origin == null || typeof origin == "undefined") logError(error);
    if (!fs.existsSync(filename)) fs.writeFileSync(filename, "");
    fs.appendFileSync(filename, error + "\n" + origin + "\n");
  }
}

process.on("unhandledRejection", async (reason, promise) => {
  logError(reason);
});
process.on("uncaughtException", async (error) => {
  logError(error);
});
process.on("uncaughtExceptionMonitor", async (error, origin) => {
  logError(error, origin);
});

module.exports = {
  setFilePath: function (path) {
    filename = path;
  },
};

app.use(cookieParser());

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item, priority) {
    let added = false;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority >= priority) {
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

app.get(`/api/search`, async (req, res) => {
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

app.get(`/user/signup`, (req, res) => {

})

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/search.html'));
});

app.get('/api/js', (req, res) => {
  res.set('Content-Type', 'text/js')
  res.sendFile(path.join(__dirname, '/script.js'))
})

app.get('/src/login', (req, res) => {
  res.set('Content-Type', 'text/js')
  res.sendFile(path.join(__dirname, '/login.js'))
})

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, '/search.html'))
})

app.get('/styles.css', (req, res) => {
  res.set('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, '/styles.css'));
});

app.get(`/login`, (req, res) => {
  const token = req.cookies.token;
  const data = fs.readFileSync("src/database/users.json");
  const jsonData = JSON.parse(data);
  if (jsonData.some((u) => u.token === token)) {
    res.redirect('/')
  } else {
    res.sendFile(path.join(__dirname, '/login.html'))
  }
})

app.post(`/api/login`, (req, res) => {
  const { token, email } = req.query;
  const data = fs.readFileSync("src/database/users.json");
  const jsonData = JSON.parse(data);
  const user = jsonData.find((u) => u.token === token && u.email === email);
  console.log("1")
  console.log("token:" + token);
  
  if (user == null) {
    return res.send('User not found')
  } else if (user) {
    console.log("2 - user found");
    if (token) {
      console.log('token inserted')
      if (jsonData.some((user) => user.email === email)) {
        if (jsonData.some((user) => user.token === token)) {
          console.log("token correct")
          try {
            console.log("Works")
            res.cookie("token", token, { httpOnly: true, secure: true });
            console.log("works")
            return res.redirect('/')
          } catch (err) {
            res.send("There was an error");
            console.log(err);
          }
        }
      }
    } else {
      res.send(`Token not found for the user`);
    }
  } 
});

app.post(`/user/login`, (req, res) => {
  const { token, email } = req.query;
  const data = fs.readFileSync("src/database/users.json");
  const jsonData = JSON.parse(data);
  const user = jsonData.find((u) => u.email === email);
  console.log("1")
  if (user) {
    console.log("2")
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
    console.log("1")
    res.send(`User not found`);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function calculatePriority(result, searchQuery) {
  let priority = 0;
  const title = result.title.toLowerCase();
  for (key in searchQuery) {
    if (Array.isArray(result[key])) {
      priority += result[key].filter((value) =>
        searchQuery[key].includes(value.toLowerCase())
      ).length;
    } else {
      priority += result[key] === searchQuery[key] ? 1 : 0;
    }
  }
  const distance = levenshteinDistance(title, searchQuery.title.toLowerCase());
  priority += 1 / (distance + 1);
  return priority;
}

function fuzzySearch(data, query) {
  const threshold = 0.1;
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

function levenshteinDistance(arr1, arr2) {
  const m = arr1.length;
  const n = arr2.length;
  const dp = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  );

  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0) {
        dp[i][j] = j;
      } else if (j === 0) {
        dp[i][j] = i;
      } else {
        const str1 = arr1[i - 1];
        const str2 = arr2[j - 1];
        const distance = levenshteinDistanceHelper(str1, str2);
        dp[i][j] =
          distance + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function levenshteinDistanceHelper(str1, str2) {
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
