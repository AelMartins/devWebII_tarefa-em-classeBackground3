const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sql = require('mssql');

const app = express();

app.use(express.json());

app.listen(8080, () => {
    console.log("O SERVIDOR ESTA ATIVO NA PORTA 8080");
})