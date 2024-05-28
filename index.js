const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

//Criar o app
const app = express();

// Criando frunção p/ criptografar senhas
const cipher = {
    algorithm: "aes256",
    secret: "chaves",
    type: "hex"
}

async function getCrypto(password){
    return new Promise((resolve, reject) => {
        const cipherStream = crypto.createCipher(cipher.algorithm, cipher.secret);
        let encryptedData = '';

        cipherStream.on('readable', () =>{
            let chunk;
            while (null !== (chunk = cipherStream.read())){
                encryptedData += chunk.toString(cipher.type);
            }
        });

        cipherStream.on('end', ()=>{
            resolve(encryptedData);
        });

        cipherStream.on('error', (error)=>{
            reject(error);
        });

        cipherStream.write(password);
        cipherStream.end();
    })
}

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

const Person = require('./models/Person.js');

app.use(
    express.urlencoded({
        extended: true,
    }),
)

app.use(express.json());

app.post('/login', async (req, res) =>{
    let {email, pass} = req.body;
    try{
        let encryptedPass = await getCrypto(pass);
        const person = await Person.findOne({ email, pass: encryptedPass});
        if(!person){
            res.status(422).json({message: 'Credenciais inválidas'});
            return;
        }
        res.status(200).json({message: 'Usuário logado', user: person});
    } catch(error){
        res.status(500).json({error: error.message});
    }
})

//Rotas 
app.post('/person', async (req, res) => {
    let { email, pass } = req.body;

    //C do crud
    try{
        let newPass = await getCrypto(pass);
        const person = {
            email,
            pass: newPass
        };
        await Person.create(person);
        res.status(201).json({message: 'Pessoa cadastrada no sys com sucesso'});
    } catch(error){
        res.status(500).json({erro: error});
    }
});

//R do crud
app.get('/person', async (req, res) =>{
    try{
        const people = await Person.find();
        res.status(200).json(people)
    }catch(error){
        res.status(500).json({erro: error})
    }
})

// R do crud Id específico
app.get('/person/:id', async (req, res) =>{
    const id = req.params.id;

    try{
        const person = await Person.findOne({ _id: id})
        if(!person){
            res.status(422).json({ message: 'Usuário não encontrado' })
            return
        }
        res.status(200).json(person)
    }catch (error){
        res.status(500).json({erro: error})
    }
})

//U do crud
app.patch('/person/:id', async (req, res) =>{
    const { email, pass } = req.body;
    const id = req.params.id;
    const person = {
        email,
        pass
    }

    try{
        const updatedPerson = await Person.updateOne({_id: id}, person)
        if (updatedPerson.matchedCount === 0){
            res.status(422).json({message: 'Usuário não encontrato'})
            return
        }
        res.status(200).json(person)
    }catch (error){
        res.status(500).json({erro: error})
    }
})

//D do crud
app.delete('/person/:id', async (req, res) =>{
    const id = req.params.id

    const person = await Person.findOne({_id: id});

    if(!person){
        res.status(422).json({message: 'Usuário não encontrado'})
        return
    }
    try{
        await Person.deleteOne({_id: id})
        res.status(200).json({message: 'Usuário removido com sucesso'})
    }catch(error){
        res.status(500).json({erro: error})
    }
})


//Deixar API pública
app.listen(3000);