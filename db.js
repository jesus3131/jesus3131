import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Cargar las variables de entorno desde un archivo .env

// Crear un pool de conexiones a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Número máximo de conexiones
  queueLimit: 0 // Número máximo de conexiones en la cola (0 = ilimitado)
});

// Exportar el pool para usarlo en otros archivos
export default pool;
