const getData = async (url = "") => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
};

const url = "http://localhost:3000/api/search?title=" + this.query;

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

  const htmlContent = `
        <h2>Title: ${jsonData.data[0].title}</h2>
        <p>Description: ${jsonData.data[0].description}</p>
        <p>URL: <a href="${jsonData.data[0].url}">${jsonData.data[0].title}</a></p>
        <link rel="stylesheet" href="../styles.css" />
    `;
  
  dataContainer.innerHTML = htmlContent;
}
