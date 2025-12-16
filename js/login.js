// login.js
const boton = document.getElementById("login");

boton.addEventListener("click", (event)=>{
    event.preventDefault(); // Evita que el formulario se envíe de la forma tradicional
    // lo que que quiero que se ejecute cuando en el boton hagan click
    // URL del endpoint de autenticación en el servidor
    const loginUrl = "https://disciplined-amazement-production.up.railway.app/access/token";

    let correo = document.getElementById("inputEmail").value;
    let contrasenia = document.getElementById("inputPassword").value;

    // Crear objeto URLSearchParams para enviar datos como formulario
    const formData = new URLSearchParams();

    // Agregar credenciales al formulario
    formData.append("username", correo);  // Email del usuario
    formData.append("password", contrasenia); // Contraseña del usuario

    // Realizar petición HTTP POST al servidor
    fetch(loginUrl, {
        method: "POST",  // Método HTTP para enviar datos
        headers: {
            // Especifica que enviamos datos de formulario codificados en URL
            "Content-Type": "application/x-www-form-urlencoded",
            // Especifica que esperamos recibir JSON como respuesta
            "accept": "application/json"
        },
        body: formData  // Datos del formulario a enviar
    })
    .then(response => {
        // Verificar si la respuesta fue exitosa (status 200-299)
        if (!response.ok) {
            // Si hay error, convertir respuesta a JSON y lanzar excepción
            return response.json().then(err => { throw err });
        }
        // Si todo está bien, convertir respuesta a JSON
        return response.json();
    })
    .then(data => {
        // Manejar respuesta exitosa del servidor
        console.log("Login exitoso:", data);
        
        // Guardar token de acceso en localStorage del navegador
        localStorage.setItem("access_token", data.access_token);
        
        // Guardar información del usuario en localStorage (convertida a JSON)
        localStorage.setItem("user", JSON.stringify(data.user));

        // REDIRECCIÓN DESPUÉS DEL LOGIN EXITOSO
        // Opción 1: Redirección inmediata
        window.location.href = "dashboard.html";
        
        // Opción 2: Reemplazar la página actual (no permite volver atrás)
        // window.location.replace("dashboard.html");
    })
    .catch(error => {
        // Manejar cualquier error que ocurra durante el proceso
        console.error("Error en login:", error);
        const mensaje = document.getElementById("error-message");
        mensaje.style.display = "block"
        mensaje.innerHTML = error.detail;
    });
});