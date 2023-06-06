const express = require("express");

const sqlite3 = require("sqlite3");

const { open } = require("sqlite");

const path = require("path");

const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());

let db = null;

const DbPath = path.join(__dirname, "userData.db");
const connectionToDatabase = async () => {
  try {
    db = await open({
      filename: DbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is starting at port 3000");
    });
  } catch (error) {
    console.log(`Error Mesg ${error.message}`);
    process.exit(1);
  }
};

connectionToDatabase();

//signup or register API
app.post("/register", async (request, response) => {
  const userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;
  const checkUserInDataBaseQuery = `select * from user where username = '${username}'`;
  const checkUserInDataBase = await db.get(checkUserInDataBaseQuery);
  if (checkUserInDataBase === undefined) {
    const lengthPassword = password.length;
    if (password.length < 5) {
      response.status(400);

      response.send("Password is too short");
    } else {
      const bcryptPassword = await bcrypt.hash(password, 10);
      const postQuery = `insert into user (username,name, password, gender, location) values
           ('${username}','${name}','${bcryptPassword}','${gender}','${location}')`;
      const registeredUser = await db.run(postQuery);
      response.status(200);

      response.send("User Created Successfully");
    }
  } else {
    response.status(400);

    response.send("User already exists");
  }
});

//signIn or loginin API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `select * from user where username = '${username}'`;
  const userDetails = await db.get(checkUserQuery);
  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const bcryptPasswordMatched = await bcrypt.compare(
      password,
      userDetails.password
    );
    if (bcryptPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//updating password API
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserQuery = `select * from user where username = '${username}'`;
  const getUser = await db.get(getUserQuery);
  if (getUser !== undefined) {
    const encryptedPassword = await bcrypt.compare(
      oldPassword,
      getUser.password
    );
    if (encryptedPassword === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const updatedEncryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `update user set
                password = '${updatedEncryptedPassword}' 
             where username = '${username}'`;
        const updatePassword = await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
