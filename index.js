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

  app.get('/', (req, res) => {
    res.send('HOME PAGE');
  });

  app.post('/login', async (req, res) => {
    const { name, password } = req.body;
  
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .query('SELECT * FROM Users WHERE name = @name');
    const user = result.recordset[0];

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).send('INFORMAÇÕES INCORRETAS!');
    }

    const token = jwt.sign({ userId: user.id }, dbConfig.tchave);
  
    res.status(200).json({ token });
  });