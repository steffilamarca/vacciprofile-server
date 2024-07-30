import mysql from 'mysql2';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root', 
    database: 'vacciProfileDb'
});

export default pool.promise();
