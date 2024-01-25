const fuzzySearch = require('./index.js');

const queue = [ ];

function similarity(str, keywords, threshold = 0.7) {
    result = 0;
    for (const keyword of keywords) {
        if (fuzzySearch(keyword.toLowerCase(), str.toLowerCase(), threshold)) {
            result += 1 / keywords.length;
        }
    }
  
    return result;
  }

class QueueElement {
    priority = 0;
    data;
    constructor(priority, data) {
        this.priority = priority;
        this.data = data;
    }
}

module.exports = {
    "addQueue": (input, data) => {
        data.forEach(datael => {
            queue.push(new QueueElement(similarity(input, datael["keywords"]), datael))
        })
    },
    "nextUp": () => {
        let highest = new QueueElement(-1);
        queue.forEach(el => {
            if (el.priority > highest.priority) {
                highest = el;
            }
        });
        if (highest.priority == -1) return null;
        queue.remove(highest);
        return highest;
    },
    "QueueElement": QueueElement
}