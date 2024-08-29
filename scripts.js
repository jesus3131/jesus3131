// Función para mostrar productos desde la base de datos
async function mostrarProductos() {
    try {
        const response = await axios.get('/productos');
        const productos = response.data;

        const contenedorProductos = document.getElementById('productos');
        contenedorProductos.innerHTML = ''; // Limpiar contenedor

        productos.forEach(producto => {
            const productoHTML = `
                <div class="card">
                    <img src="${producto.image}" class="card-img-top" alt="${producto.title}">
                    <div class="card-body">
                        <h5 class="card-title">${producto.title}</h5>
                        <p class="card-text">${producto.description}</p>
                        <p class="card-text">$${producto.price}</p>
                        <button class="btn btn-primary" onclick="editarProducto(${producto.id})">Editar</button>
                        <button class="btn btn-secondary" onclick="agregarAlCarrito(${producto.id})">Agregar al Carrito</button>
                    </div>
                </div>
            `;
            contenedorProductos.innerHTML += productoHTML;
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Función para editar un producto y mostrar el modal
async function editarProducto(productoId) {
    try {
        const response = await axios.get(`/api/productos/${productoId}`);
        const producto = response.data;

        // Rellenar el modal con la información del producto
        document.getElementById('editarId').value = producto.id;
        document.getElementById('editarTitle').value = producto.title;
        document.getElementById('editarDescription').value = producto.description;
        document.getElementById('editarPrice').value = producto.price;
        document.getElementById('editarImage').value = producto.image;

        // Mostrar el modal de edición
        const modal = new bootstrap.Modal(document.getElementById('modalEditarProducto'));
        modal.show();
    } catch (error) {
        console.error('Error al cargar el producto para edición:', error);
    }
}

// Función para enviar el formulario de edición de producto
async function enviarFormularioEditarProducto(event) {
    event.preventDefault();

    const id = document.getElementById('editarId').value;
    const updatedProducto = {
        title: document.getElementById('editarTitle').value,
        description: document.getElementById('editarDescription').value,
        price: document.getElementById('editarPrice').value,
        image: document.getElementById('editarImage').value
    };

    try {
        await axios.put(`/api/productos/${id}`, updatedProducto);
        alert('Producto actualizado con éxito.');
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarProducto'));
        modal.hide();
        mostrarProductos(); // Actualizar la lista de productos
    } catch (error) {
        console.error('Error al editar producto:', error);
    }
}

// Función para eliminar un producto
async function eliminarProducto() {
    const productoId = document.getElementById('editarId').value;

    try {
        await axios.delete(`/api/productos/${productoId}`);
        alert('Producto eliminado con éxito.');
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarProducto'));
        modal.hide();
        mostrarProductos(); // Actualizar la lista de productos
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
    }
}

// Función para agregar un producto al carrito
function agregarAlCarrito(productoId) {
    // Aquí iría la lógica para agregar el producto al carrito
}

// Función para manejar el formulario de registro de usuario
const registroForm = document.getElementById("registroForm");
registroForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch('/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, email, password })
        });
        const result = await response.json();
        alert("Usuario registrado con éxito.");
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        alert("Error al registrar usuario.");
    }
});


// Función para enviar el formulario de contacto
async function enviarFormularioContacto(event) {
    event.preventDefault();
    // Aquí iría la lógica para enviar el formulario de contacto
}

// Inicializar eventos cuando el documento esté cargado
document.addEventListener('DOMContentLoaded', () => {
    mostrarProductos();

    // Asignar la función de envío al formulario de edición
    document.getElementById('formEditarProducto').addEventListener('submit', enviarFormularioEditarProducto);

    // Asignar la función de eliminación al botón "Eliminar" en el modal
    document.getElementById('botonEliminarProducto').addEventListener('click', eliminarProducto);

    // Asignar la función de envío al formulario de registro de producto
    const formularioRegistroProducto = document.getElementById('registroProductoForm');
    if (formularioRegistroProducto) {
        formularioRegistroProducto.addEventListener('submit', enviarFormularioRegistroProducto);
    }

    // Asignar la función de envío al formulario de registro de usuario
    const registroForm = document.getElementById("registroForm");
    if (registroForm) {
        registroForm.addEventListener("submit", enviarFormularioRegistro);
    }

    // Asignar la función de envío al formulario de contacto
    document.getElementById('formulario-contacto').addEventListener('submit', enviarFormularioContacto);
});
// Función para manejar el formulario de registro de producto
const formRegistrarProducto = document.getElementById("formRegistrarProducto");
formRegistrarProducto.addEventListener("submit", async function (e) {
    e.preventDefault();
    const title = document.getElementById("registroTitle").value;
    const description = document.getElementById("registroDescription").value;
    const price = document.getElementById("registroPrice").value;
    const image = document.getElementById("registroImage").value;

    try {
        const response = await fetch('/api/productos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, price, image })
        });
        const result = await response.json();
        alert("Producto registrado con éxito.");
        mostrarProductos(); // Actualiza la lista de productos después de agregar uno nuevo
    } catch (error) {
        console.error('Error al registrar producto:', error);
        alert("Error al registrar producto.");
    }
});