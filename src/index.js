const express = require("express");
const app = express();
const port = 3000;

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
  try {
    const searchQuery = await req.query;
    const filteredSearch = await searchList.filter((info) => {
      let isValid = true;
      for (key in searchQuery) {
        if (Array.isArray(info[key])) {
          isValid =
            isValid &&
            info[key].some((value) => searchQuery[key].includes(value));
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

    res.json({ data: searchResults });
  } catch (err) {
    res.send(err);
  }
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
