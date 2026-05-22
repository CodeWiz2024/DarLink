// Import: import mysql from 'mysql2';
import mysql from 'mysql2';
// Import: import dotenv from 'dotenv';
import dotenv from 'dotenv';
// Load .env configuration
dotenv.config(); // Load environment variables from the .env file
// import mysql labrary to connect to the database 
const pool = mysql.createPool({
    // L6: host: process.env.DB_HOST, // Database host from environment variables
    host: process.env.DB_HOST, // Database host from environment variables
    // L7: user: process.env.DB_USER, // Database username from environment variables
    user: process.env.DB_USER, // Database username from environment variables
    // L8: password: process.env.DB_PASSWORD, // Database password from environment variables
    password: process.env.DB_PASSWORD, // Database password from environment variables
    // L9: database: process.env.DB_NAME, // Database name from environment variables
    database: process.env.DB_NAME, // Database name from environment variables
    // L10: port: process.env.DB_PORT, // Database port from environment variables
    port: process.env.DB_PORT, // Database port from environment variables
// L11: }).promise();
}).promise();
// create a connection pool to the database with the specified host, user, password, and database name
pool.query('SELECT 1').then(()=>{
    // Console: console.log('Connected to the database');
    console.log('Connected to the database');
// L15: }).catch((error) => {
}).catch((error) => {
        // Console: console.error('❌ Failed to connect to the database:', error.message);
        console.error('❌ Failed to connect to the database:', error.message);
    // End handler/callback
    });
// test the database connection by executing a simple query and log the result
export default pool;
// export the connection pool for use in other parts of the application// Force redeploy 
