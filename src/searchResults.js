const cookieName = 'query';
const cookies = document.cookie.split('; ');
const query = cookies[0].split('=')[1];
for (let i = 0; i < cookies.length; i++) {
  const cookie = cookies[i];
  if (cookie.startsWith(cookieName + '=')) {
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

console.log(query)
console.log(cookies)

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
  console.log(jsonData)
  console.log(jsonData.data)
  document.querySelector('title').textContent = `Search - ${query}`
  if (jsonData.data.length === 0) {
    const htmlContent = `
        <h2>An error occurred</h2>
    `;
    console.log("Failure 11000 - Invalid json response");
    dataContainer.innerHTML = htmlContent;
  } else {
    const htmlContent = `
        <h2>Title: ${jsonData.data[0].title}</h2>
        <p>Description: ${jsonData.data[0].description}</p>
        <p>URL: <a href="${jsonData.data[0].url}">${jsonData.data[0].title}</a></p>
    `;
    dataContainer.innerHTML = htmlContent;
  }

  
  
  
}
