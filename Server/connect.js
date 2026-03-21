import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from the .env file
// import mysql labrary to connect to the database 
const pool = mysql.createPool({
    host: process.env.DB_HOST, // Database host from environment variables
    user: process.env.DB_USER, // Database username from environment variables
    password: process.env.DB_PASSWORD, // Database password from environment variables
    database: process.env.DB_NAME, // Database name from environment variables
    port: process.env.DB_PORT, // Database port from environment variables
}).promise();
// create a connection pool to the database with the specified host, user, password, and database name
pool.query('SELECT 1').then(()=>{
    console.log('Connected to the database');
}).catch((error) => {
        console.error('❌ Failed to connect to the database:', error.message);
    });
// test the database connection by executing a simple query and log the result
export default pool;
// export the connection pool for use in other parts of the application// Force redeploy 
