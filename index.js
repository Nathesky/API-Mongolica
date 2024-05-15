const express = require('express');
const mongoose = require('mongoose');

//Criar o app
const app = express();

//Configurar a API para ler json
app.use(express.urlencoded({
    extended: true
}));

//permitindo q a api retorne um json e não um xml
app.use(express.json());

//Conexão com o banco
let url = "mongodb://localhost:27017";
mongoose.connect(url)
.then(()=>{
    console.log("conectamos no banco!!")
        app.get('/', (rep,res)=>{
        res.json({message: "Olá, mundo"});
    })
}).catch((error)=>{
    console.log(error)
})

//Deixar API pública
app.listen(3000);