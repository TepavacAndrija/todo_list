const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const bodyParser = require('body-parser');

// Konfiguracija AWS SDK-a za LocalStack
AWS.config.update({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566', // LocalStack endpoint
  accessKeyId: 'test', // Dummy access key
  secretAccessKey: 'test', // Dummy secret key
  sslEnabled: false, // Isključite SSL jer LocalStack koristi HTTP
  s3ForcePathStyle: true // Koristite path-style adresiranje za S3 (opciono)
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const app = express();

// Middleware
app.use(cors()); // Omogućava CORS
app.use(bodyParser.json()); // Parsira JSON zahtev

const TABLE_NAME = 'Tasks';

// Funkcija za proveru i kreiranje tabele
const createTableIfNotExists = async () => {
  const dynamoDbClient = new AWS.DynamoDB(); // Koristimo osnovni DynamoDB klijent za operacije sa tabelama

  try {
    // Pokušajte da opisite tabelu
    await dynamoDbClient.describeTable({ TableName: TABLE_NAME }).promise();
    console.log(`Tabela "${TABLE_NAME}" već postoji.`);
  } catch (error) {
    if (error.code === 'ResourceNotFoundException') {
      // Tabela ne postoji, kreiraj je
      const params = {
        TableName: TABLE_NAME,
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' } // Primarni ključ tipa string
        ],
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' } // HASH ključ
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      };

      try {
        await dynamoDbClient.createTable(params).promise();
        console.log(`Tabela "${TABLE_NAME}" je uspešno kreirana.`);
      } catch (createError) {
        console.error('Greška prilikom kreiranja tabele:', createError);
      }
    } else {
      console.error('Greška prilikom provere tabele:', error);
    }
  }
};

// Pozovite funkciju za proveru i kreiranje tabele
createTableIfNotExists();

// GET /tasks - Dohvatanje svih zadataka
app.get('/tasks', async (req, res) => {
  const params = { TableName: TABLE_NAME };

  try {
    const data = await dynamoDb.scan(params).promise();
    res.json(data.Items); // Vraćamo samo Items iz odgovora
  } catch (error) {
    console.error('Greška prilikom dohvatanja zadataka:', error);
    res.status(500).json({ error: 'Greška prilikom dohvatanja zadataka' });
  }
});

// POST /tasks - Dodavanje novog zadatka
app.post('/tasks', async (req, res) => {
  const { title, completed } = req.body;

  if (!title || typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Nedostaju ili su neispravni podaci.' });
  }

  const newTask = {
    id: Date.now().toString(), // Jedinstveni ID
    title,
    completed
  };

  const params = {
    TableName: TABLE_NAME,
    Item: newTask
  };

  try {
    await dynamoDb.put(params).promise();
    res.status(201).json(newTask); // Vraćamo dodati zadatak
  } catch (error) {
    console.error('Greška prilikom dodavanja zadatka:', error);
    res.status(500).json({ error: 'Greška prilikom dodavanja zadatka' });
  }
});

// DELETE /tasks/:id - Brisanje zadatka po ID-u
app.delete('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;

  const params = {
    TableName: TABLE_NAME,
    Key: { id: taskId }
  };

  try {
    await dynamoDb.delete(params).promise();
    res.status(204).send(); // Bez sadržaja (No Content)
  } catch (error) {
    console.error('Greška prilikom brisanja zadatka:', error);
    res.status(500).json({ error: 'Greška prilikom brisanja zadatka' });
  }
});

// Pokretanje servera
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend pokrenut na http://localhost:${PORT}`);
});