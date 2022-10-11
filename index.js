const app = require("./app");
const { PORT } = process.env;

app.listen(PORT, () => {
  console.log(
    "---------------------------------------------------------------"
  );
  console.log(
    `          Server is listening on http://localhost:${PORT}          `
  );
  console.log(
    "---------------------------------------------------------------"
  );
});
