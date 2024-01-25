const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const port = 3001;
const fs = require("fs");
const { scryptSync, randomBytes } = require("crypto");
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

process.on("unhandledRejection", async (reason, _promise) => {
  logError(reason);
});
process.on("uncaughtException", async (error) => {
  logError(error);
});
process.on("uncaughtExceptionMonitor", async (error, origin) => {
  logError(error, origin);
});

app.use(cookieParser());

const searchList = require(`./database/search.json`);

app.get(`/search`, async (req, res) => {
  const token = req.cookies.token;
  console.log(token);
  const data = fs.readFileSync("src/database/users.json").toString();
  const jsonData = JSON.parse(data);
  if (jsonData.some((u) => u.token === token)) {
    try {
      try {
        const queue = require("./queue.js");
        queue.addQueue(req.query["q"].replace("\+", " "), searchList);

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
