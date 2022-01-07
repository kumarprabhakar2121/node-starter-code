const app = require("./app");
const { PORT } = process.env;
const { auth, auth2 } = require("./middleware/auth");


app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
