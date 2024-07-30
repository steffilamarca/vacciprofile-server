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

                const createTableSQL = `
                    CREATE TABLE vaccines (
                        vaccineId VARCHAR(10) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        link VARCHAR(255) NOT NULL
                    )
                `;

                connection.query(createTableSQL, (err) => {
                    if (err) {
                        console.error('Error creating table:', err);
                        return;
                    }
                    console.log('Table created.');
                    connection.end();
                });
            });
        });
    });
});
