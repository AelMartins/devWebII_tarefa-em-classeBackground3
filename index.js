const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { dbConfig } = require('./data-base/data');

const app = express();

app.use(express.json());

app.listen(8080, () => {
    console.log("O SERVIDOR ESTA ATIVO NA PORTA 8080");
})

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      return res.status(200).json({});
    }
    next();
  });

//   app.get("/") -> "Home Page"

  app.get('/', (req, res) => {
    res.send(`HOME PAGE`);
  });

//   app.post("/login") -> Chamada login

  app.post('/login', async (req, res) => {
    const { name, password } = req.body;
  
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .query('SELECT * FROM Users WHERE name = @name');
    const user = result.recordset[0];

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).send(`INFORMAÇÕES INCORRETAS!`);
    }

    const token = jwt.sign({ userId: user.id }, dbConfig.tchave);
  
    res.status(200).json({ token });
  });

//   app.get("/users") -> Mostrar todos os usuários

app.get('/users', async (req, res) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decodedToken = jwt.verify(token, dbConfig.tchave);
      req.userData = { userId: decodedToken.userId };
    } catch (error) {
      return res.status(401).send(`TOKEN INVÁLIDO!`);
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .query('SELECT * FROM Users');
    const users = result.recordset;
  
    res.status(200).json({ users });
  });

//   app.post("/users") -> Criar um usuário

app.post('/users', async (req, res) => {
    let pool;
  
    try {
      pool = await mssql.connect(dbConfig);
      const result = await pool.request()
        .input('name', mssql.VarChar, req.body.name)
        .query('SELECT COUNT(*) AS count FROM users WHERE name = @name');
  
      const countUsers = result.recordset[0].count;
  
      if (countUsers > 0) {
        return res.status(400).json({ error: `NOME DE USUÁRIO JÁ REGISTRADO` });
      }

      const password = await bcrypt.hash(req.body.password, dbConfig.cryptHash);
  
      const insertUser = await pool.request()
        .input('name', mssql.VarChar, req.body.name)
        .input('password', mssql.VarChar, password)
        .query('INSERT INTO Users (name, password) VALUES (@name, @password)');
  
      const newUser = insertUser.recordset;
  
      res.status(200).send(`USUÁRIO " ${newUser} " ADICIONADO!`);
    } catch (error) {
      res.status(500).json({ error: `ERRO AO CRIAR USUÁRIO: ${error.message}` });
    } finally {
        if (pool){
            pool.close();
        }
    }
  });

//   app.put("/users/:id") -> Atualizar um usuário


//   app.delete("/users/:id") -> deletar um usuário

