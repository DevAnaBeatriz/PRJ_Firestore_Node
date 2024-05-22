const express = require("express");
const app = express();
const handlebars = require("express-handlebars").engine;
const bodyParser = require("body-parser");
const session = require('express-session');
const flash = require('express-flash');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./bd-tapwm-firebase-adminsdk-2mgxq-6a91cba306.json');
const helpers = require("handlebars-helpers")();

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.engine("handlebars", handlebars({ defaultLayout: "main", helpers: helpers }));
app.set("view engine", "handlebars");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.use(flash());

app.get("/", function (req, res) {
  res.render("primeira_pagina", { success: req.flash('success'), error: req.flash('error') });
});

app.route("/consulta")
  .get(async (req, res) => {
    const dataSnapshot = await db.collection('agendamentos').get();
    const data = [];
    dataSnapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        nome: doc.get('nome'),
        telefone: doc.get('telefone'),
        origem: doc.get('origem'),
        data_contato: doc.get('data_contato'),
        observacao: doc.get('observacao'),
      });
    });
    res.render("consulta", { data });
  });

app.route("/editar/:id")
  .get(async (req, res) => {
    const dataSnapshot = await db.collection('agendamentos').doc(req.params.id).get();
    const data = {
      id: dataSnapshot.id,
      nome: dataSnapshot.get('nome'),
      telefone: dataSnapshot.get('telefone'),
      origem: dataSnapshot.get('origem'),
      data_contato: dataSnapshot.get('data_contato'),
      observacao: dataSnapshot.get('observacao'),
    };

    res.render("editar", { data });
  });

app.route("/excluir/:id")
  .get((req, res) => {
    db.collection('agendamentos').doc(req.params.id).delete().then(() => {
      console.log('Documento excluído com sucesso.');
      res.redirect('/consulta');
    }).catch((error) => {
      console.error('Erro ao excluir o documento: ', error);
      res.status(500).send('Erro ao excluir o documento.');
    });
  });

app.post("/cadastrar", function (req, res) {
  db.collection('agendamentos').add({
    nome: req.body.nome,
    telefone: req.body.telefone,
    origem: req.body.origem,
    data_contato: req.body.data_contato,
    observacao: req.body.observacao
  }).then(function () {
    console.log('Added document');
    req.flash('success', 'Cadastro realizado com sucesso!');
    res.redirect('/');
  }).catch(function (error) {
    console.error('Error adding document: ', error);
    req.flash('error', 'Erro ao realizar cadastro.');
    res.redirect('/');
  });
});

app.route("/atualizar")
  .post((req, res) => {
    db.collection("agendamentos").doc(req.body.id).update({
      nome: req.body.nome,
      telefone: req.body.telefone,
      origem: req.body.origem,
      data_contato: req.body.data_contato,
      observacao: req.body.observacao,
    }).then(() => {
      console.log("Documento atualizado com sucesso.");
      res.redirect("/consulta");
    }).catch((error) => {
      console.error('Erro ao atualizar o documento: ', error);
      res.status(500).send('Erro ao atualizar o documento.');
    });
  });

app.listen(8081, function () {
  console.log("Servidor ativo!")
});
