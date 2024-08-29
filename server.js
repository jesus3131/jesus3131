import express from 'express';
import pool from './db.js';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';

const app = express();
const port = process.env.PORT || 3000;

// Obtener el directorio del archivo actual
const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);

// Configuración de middleware
app.use(cors());
app.use(express.static(path.join(_dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Función para crear las tablas si no existen
const crearTablas = async () => {
    const createTableQueries = [
        `
        CREATE TABLE IF NOT EXISTS productos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            image VARCHAR(255) NOT NULL
        );
        `,
        `
        CREATE TABLE IF NOT EXISTS carrito (
            id INT AUTO_INCREMENT PRIMARY KEY,
            producto_id INT NOT NULL,
            cantidad INT NOT NULL DEFAULT 1,
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
        );
        `,
        `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL
        );
        `
    ];

    try {
        for (const query of createTableQueries) {
            await pool.query(query);
        }
        console.log('Tablas creadas o ya existen.');
    } catch (error) {
        console.error('Error al crear las tablas:', error);
    }
};

// Llamar a la función para crear las tablas al iniciar el servidor
crearTablas();

// Función para descargar productos de la API y almacenarlos en la base de datos
const descargarProductos = async () => {
    try {
        const response = await axios.get('https://fakestoreapi.com/products');
        const productos = response.data;

        for (const producto of productos) {
            try {
                const [rows] = await pool.query('SELECT * FROM productos WHERE title = ?', [producto.title]);

                if (rows.length === 0) {
                    await pool.query(
                        'INSERT INTO productos (title, description, price, image) VALUES (?, ?, ?, ?)',
                        [producto.title, producto.description, producto.price, producto.image]
                    );
                    console.log(`Producto "${producto.title}" insertado.`);
                } else {
                    console.log(`Producto "${producto.title}" ya existe en la base de datos.`);
                }
            } catch (error) {
                console.error('Error al insertar producto:', producto, error);
            }
        }
        console.log('Productos descargados y almacenados en la base de datos.');

        const [rows] = await pool.query('SELECT * FROM productos');
        console.log('Productos en la base de datos:', JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error('Error al descargar productos de la API:', error);
    }
};

// Llamar a la función para descargar productos cuando inicie el servidor
descargarProductos();

// Ruta para mostrar los productos en la vista
app.get('/productos', async (req, res) => {
    try {
      const [productos] = await pool.query('SELECT * FROM productos');
      res.json(productos);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).send('Error al obtener productos');
    }
});

// Obtener un producto específico por ID
app.get('/api/productos/:id', async (req, res) => {
    const productoId = parseInt(req.params.id);
    try {
        const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [productoId]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// Agregar un nuevo producto
app.post('/api/productos', async (req, res) => {
    const { title, description, price, image } = req.body;
    try {
        const [checkRows] = await pool.query('SELECT COUNT(*) as count FROM productos WHERE title = ?', [title]);
        if (checkRows[0].count > 0) {
            return res.status(400).json({ error: 'El producto ya existe en la base de datos' });
        }

        const [result] = await pool.query('INSERT INTO productos (title, description, price, image) VALUES (?, ?, ?, ?)', [title, description, price, image]);
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Error al agregar producto:', error);
        res.status(500).json({ error: 'Error al agregar producto' });
    }
});

// Ruta para actualizar un producto
app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, price, image } = req.body;

    try {
        // Realizar la actualización del producto en la base de datos
        const [result] = await pool.query('UPDATE productos SET title = ?, description = ?, price = ?, image = ? WHERE id = ?', [title, description, price, image, id]);

        if (result.affectedRows > 0) {
            // Obtener los datos del producto actualizado para mostrar en consola
            const [updatedProduct] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
            console.log('Producto actualizado:', updatedProduct[0]);
            
            // Enviar la respuesta en formato JSON
            res.json(updatedProduct[0]);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// Eliminar un producto
app.delete('/api/productos/:id', async (req, res) => {
    const productoId = parseInt(req.params.id);
    try {
        const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [productoId]);
        if (result.affectedRows > 0) {
            res.json({ message: 'Producto eliminado' });
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// Agregar un producto al carrito
app.post('/api/carrito', async (req, res) => {
    const { id: productoId } = req.body;
    try {
        const [producto] = await pool.query('SELECT * FROM productos WHERE id = ?', [productoId]);
        if (producto.length > 0) {
            await pool.query('INSERT INTO carrito (producto_id, cantidad) VALUES (?, 1) ON DUPLICATE KEY UPDATE cantidad = cantidad + 1', [productoId]);
            res.status(201).json({ message: 'Producto agregado al carrito' });
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({ error: 'Error al agregar al carrito' });
    }
});

// Obtener todos los productos del carrito
app.get('/api/carrito', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.id, p.title, p.price, p.image, c.cantidad 
            FROM carrito c 
            JOIN productos p ON c.producto_id = p.id
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
});

// Eliminar un producto del carrito
app.delete('/api/carrito/:id', async (req, res) => {
    const productoId = parseInt(req.params.id);
    try {
        const [result] = await pool.query('DELETE FROM carrito WHERE producto_id = ?', [productoId]);
        if (result.affectedRows > 0) {
            res.json({ message: 'Producto eliminado del carrito' });
        } else {
            res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }
    } catch (error) {
        console.error('Error al eliminar del carrito:', error);
        res.status(500).json({ error: 'Error al eliminar del carrito' });
    }
});

// Registrar un nuevo usuario
app.post('/api/usuarios',
    // Validaciones
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('El correo electrónico debe ser válido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { nombre, email, password } = req.body;

            // Encriptar contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insertar en la base de datos
            const [result] = await pool.query("INSERT INTO usuarios (name, email, password) VALUES (?, ?, ?)", [nombre, email, hashedPassword]);

            res.status(201).json({ message: 'Usuario registrado con éxito', userId: result.insertId });
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            res.status(500).json({ error: 'Error al registrar usuario' });
        }
    }
);

// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});
// Rutas estáticas
app.get('/', (req, res) => {
    res.sendFile(path.join(_dirname, 'views/index.html'));
});

app.get('/carrito', (req, res) => {
    res.sendFile(path.join(_dirname, 'public/carrito.html'));
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor en funcionamiento en http://localhost:${port}`);
});
