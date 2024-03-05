document.getElementById("buttonLogin").addEventListener("click", function () {
  console.log("0");
  const email = document.getElementById("email").value;
  const token = document.getElementById("token").value;
  console.log("0.5");
  const url = `http://localhost:3000/api/login?email=${email}&token=${token}`;

  postData(url)
    .then((response) => {
      console.log("Post request successful:", response);
    })
    .catch((error) => {
      console.error("Error:", error);
      // Handle login error here
    });
});
console.log("5")
const postData = async (url = "") => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {}
  });
  return response.json();
};
