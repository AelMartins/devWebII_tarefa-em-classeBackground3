const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mssql = require("mssql");
const { dbConfig } = require("./data-base/data");

const app = express();

app.use(express.json());

app.listen(8080, () => {
  console.log("O SERVIDOR ESTA ATIVO NA PORTA 8080");
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    return res.status(200).json({});
  }
  next();
});

//   app.get("/") -> "Home Page"

app.get("/", (req, res) => {
  res.send(`HOME PAGE`);
});

//   app.post("/login") -> Chamada login

app.post("/login", async (req, res) => {
  const { name, password } = req.body;

  let pool;

  try {
    pool = await mssql.connect(dbConfig);
    const result = await pool
      .request()
      .input("name", mssql.NVarChar, name)
      .query("SELECT * FROM Users WHERE name = @name");
    const user = result.recordset[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send(`INFORMAÇÕES INCORRETAS!`);
    }

    const token = jwt.sign({ userId: user.id }, dbConfig.tchave);

    res.status(200).json({ token });
  } catch (error) {
    if (pool) {
      pool.close();
    }
    res.status(500).json({ error: `ERRO DE REQUISIÇÃO DE LOGIN: '${error.message}'` });
  } finally {
    if (pool) {
      pool.close();
    }
  }
});

//   app.get("/users") -> Mostrar todos os usuários

app.get("/users", async (req, res) => {
  let poolGetUsers;

  try {

    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, dbConfig.tchave);

    req.userData = { userId: decodedToken.user.id };

  } catch (error) {
    return res.status(500).json({ error: `TOKEN INVÁLIDO: ${error.message}` });
  }

  try {
    poolGetUsers = await mssql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM Users");

    const users = result.recordset;

    res.status(200).json({ users });
  } catch (error) {
    if (poolGetUsers) {
      poolGetUsers.close();
    }
    res.status(500).json({ error: `ERRO AO REQUISITAR USUÁRIOS: ${error.message}` });
  } finally {
    if (poolGetUsers) {
      poolGetUsers.close();
    }
  }
});

//   app.post("/users") -> Criar um usuário

app.post("/users", async (req, res) => {
  let pool;

  try {
    pool = await mssql.connect(dbConfig)
    const result = await pool
      .request()
      .input("name", mssql.VarChar, req.body.name)
      .query("SELECT COUNT(*) AS count FROM users WHERE name = @name");

    const countUsers = result.recordset[0].count;

    if (countUsers > 0) {
      return res.status(400).json({ error: `NOME DE USUÁRIO JÁ REGISTRADO` });
    }

    const addPassword = await bcrypt.hash(req.body.password, dbConfig.cryptHash);

    const insertUser = await pool
      .request()
      .input("name", mssql.VarChar, req.body.name)
      .input("password", mssql.VarChar, addPassword)
      .query("INSERT INTO Users (name, password) VALUES (@name, @password)");

    const newUser = insertUser.recordset;

    res.status(200).send(`USUÁRIO " ${newUser} " ADICIONADO!`);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: `ERRO AO CRIAR USUÁRIO: ${error.message}` });
  } finally {
    if (pool) {
      pool.close();
    }
  }
});

//   app.put("/users/:id") -> Atualizar um usuário

app.put("/users/:id", async (req, res) => {
  const { name, password } = req.body;
  const { id } = req.params;

  let pool;

  try {
    pool = await mssql.connect(dbConfig);
    const result = await pool
      .request()
      .input("name", mssql.VarChar, name)
      .query(`SELECT COUNT(*) AS count FROM users WHERE ${name} = @name`);

    const countUsers = result.recordset[0].count;

    if (countUsers > 0) {
      return res.status(400).json({ error: `NOME DE USUÁRIO JÁ REGISTRADO` });
    }

    const newPassword = await bcrypt.hash(password, dbConfig.cryptHash);

    await pool
      .request()
      .input("name", mssql.VarChar, name)
      .input("password", mssql.VarChar, newPassword)
      .input("id", mssql.Int, id)
      .query(`UPDATE Users SET name = @name, password = @password) WHERE id = @id`);
    res.status(200).send(`USUÁRIO ATUALIZADO!`);
  } catch (error) {
    res.status(500).json({ error: `ERRO AO ATUALIZAR USUÁRIO: ${error.message}` });
  } finally {
    if (pool) {
      pool.close();
    }
  }
});

//   app.delete("/users/:id") -> deletar um usuário

app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  let pool;

  try {
    pool = await mssql.connect(dbConfig);

    const result = await pool
      .request()
      .input("id", mssql.Int, id)
      .query(`SELECT name FROM Users WHERE id = @id`);

    const userName = result.recordset[0].name;

    await pool
      .request()
      .input("id", mssql.Int, id)
      .query(`DELETE FROM Users WHERE id = @id`);

    res.status(200).send(`O USUÁRIO "${userName}" FOI DELETADO COM SUCESSO!`);
  } catch (error) {
    res.status(500).json({ error: `ERRO AO DELETAR USUÁRIO: ${error.message}` });
  } finally {
    if (pool) {
      pool.close();
    }
  }
});
