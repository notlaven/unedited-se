const cookieName = "query";
const cookies = document.cookie.split("; ");
for (let i = 0; i < cookies.length; i++) {
  const cookie = cookies[i];
  if (cookie.startsWith(cookieName + "=")) {
    const cookieValue = cookie.substring(cookieName.length + 1);
    console.log(cookieValue);
    break;
  }
}

const getData = async (url = "") => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
};

console.log(this.query);
console.log(this.cookies);
console.log(document.cookie.split("; "));

const url = "http://localhost:3000/api/search?" + document.cookie;

getData(url)
  .then((response) => {
    console.log("Get request successful:", response);
    insertData(response);
  })
  .catch((error) => {
    console.error("Error:", error);
  });

function insertData(jsonData) {
  const dataContainer = document.getElementById("data-container");
  console.log(jsonData);
  console.log(jsonData.data);
  if (jsonData.data.length === 0) {
    const htmlContent = `
        <h2>An error occurred</h2>
    `;
    console.log("Failure 11000 - Invalid json response");
    dataContainer.innerHTML = htmlContent;
  } else {
    const htmlContent = jsonData.data.map((data) => {
      return `
        <h2>Title: ${data.title}</h2>
        <p>Description: ${data.description}</p>
        <p>URL: <a href="${data.url}">${data.title}</a></p>
      `;
    }).join('');
    dataContainer.innerHTML += htmlContent;
  }
}
