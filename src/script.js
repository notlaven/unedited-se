document.getElementById("buttonSearch").addEventListener("click", function () {
  const searchTerm = document.getElementById("searchInput").value.trim();

  const url = `http://localhost:3000/api/search?title=${searchTerm}`;

  getData(url)
    .then((response) => {
      console.log("Get request successful:", response);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});


const getData = async (url = "") => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
};
