const searchInput = document.getElementById("searchInput");
const suggestionsDiv = document.getElementById("suggestions");

const url = "http://localhost:3000/api/search?" + searchInput;
console.log(searchInput.value);

async function addToSuggestions(jsonData) {
  await jsonData.data.map((data) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = data.title
    a.href = "http://localhost:3000/search?title=" + data.title
    a.id = "suggestions"
    li.id = "suggestions"
    li.appendChild(a)
    suggestionsDiv.appendChild(li);
  });
}

async function filterSuggestions() {
  if (searchInput.value.length == 1 ?? 0) {
    suggestionsDiv.innerHTML = "";
  } else if (searchInput.value.length > 1) {
    const response = await getData(
      "http://localhost:3000/api/search?title=" + searchInput.value
    ).then((response) => {
      suggestionsDiv.innerHTML = "";
      if (response.data[0]) {
        addToSuggestions(response);
      }
    });
    console.log(searchInput.value);
    console.log(response);
  }
}

searchInput.addEventListener("keyup", filterSuggestions);
