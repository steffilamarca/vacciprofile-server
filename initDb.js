import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL.');

    connection.query('DROP DATABASE IF EXISTS vacciProfileDb', (err) => {
        if (err) {
            console.error('Error dropping database:', err);
            return;
        }

        connection.query('CREATE DATABASE vacciProfileDb', (err) => {
            if (err) {
                console.error('Error creating database:', err);
                return;
            }
            console.log('Database created.');

            connection.query('USE vacciProfileDb', (err) => {
                if (err) {
                    console.error('Error selecting database:', err);
                    return;
                }
                
                const createManufacturersTableSQL = `
                    CREATE TABLE manufacturers (
                        manufacturerId VARCHAR(10) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description VARCHAR(255),
                        information JSON,
                        vaccineList JSON,
                        vaccineListLink VARCHAR(255)
                    )
                `;

                connection.query(createManufacturersTableSQL, (err) => {
                    if (err) {
                        console.error('Error creating manufacturer table:', err);
                        return;
                    }
                    console.log('Manufacturer table created.');
                    connection.end();
                });

                const createVaccinesTableSQL = `
                    CREATE TABLE vaccines (
                        vaccineId VARCHAR(10) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        link VARCHAR(255) NOT NULL
                    )
                `;

                connection.query(createVaccinesTableSQL, (err) => {
                    if (err) {
                        console.error('Error creating vaccine table:', err);
                        return;
                    }
                    console.log('Vaccine table created.');
                    connection.end();
                });
            });
        });
    });
});
