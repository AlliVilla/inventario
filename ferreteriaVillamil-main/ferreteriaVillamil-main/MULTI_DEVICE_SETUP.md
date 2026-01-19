# Guía de Configuración Multidispositivo

Esta guía te ayudará a configurar tu sistema para usar la aplicación "Ferretería Villamil" tanto en tu computadora principal como en tu iPad simultáneamente.

## 1. Configuración de Red (Ya realizada)
Hemos configurado la aplicación para que funcione en tu dirección IP local: `192.168.1.115`.

**IMPORTANTE:** Si tu computadora cambia de red o se reinicia el router, es posible que esta IP cambie. Si deja de funcionar, necesitarás actualizar la IP en el archivo `frontend/.env`.

## 2. Configurar el Firewall de Windows
Para que el iPad pueda "ver" tu computadora, necesitas permitir el tráfico a los servidores.

1. Presiona la tecla `Windows` y escribe **"PowerShell"**.
2. Haz clic derecho en "Windows PowerShell" y selecciona **"Ejecutar como administrador"**.
3. Copia y pega estos comandos (uno por uno) para abrir los puertos 3000 (Backend) y 5173 (Frontend):

```powershell
New-NetFirewallRule -DisplayName "Ferreteria Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Ferreteria Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

## 3. Iniciar Servicios

### A. Base de Datos (Importante)
El error "Error interno" suele ocurrir porque la base de datos está apagada. Asegúrate de iniciarla:

1. Abre una terminal.
2. Ejecuta:
   ```bash
   docker start ferreteria_db
   ```
   *(Si dice que no existe, ejecuta el comando de tu `comando.txt` o `docker-compose up -d db`)*.

### B. Iniciar la Aplicación
En tu computadora principal:


1. **Backend:**
   Abre una terminal en `backend/` y ejecuta:
   ```bash
   npm start
   ```

2. **Frontend:**
   Abre una terminal en `frontend/` y ejecuta:
   ```bash
   npm run dev -- --host
   ```
   **Nota:** Es crucial agregar `-- --host` al final para que sea accesible desde la red.

## 4. Conectar desde el iPad
1. Asegúrate de que el iPad esté conectado a la **misma red Wi-Fi** que la computadora.
2. Abre Safari o Chrome en el iPad.
3. Escribe la siguiente dirección:
   
   ```
   http://192.168.1.115:5173
   ```

¡Deberías ver la aplicación funcionando!

## Solución de Problemas

- **"No se puede conectar al servidor"**: 
  - Verifica que ambos dispositivos estén en la misma red Wi-Fi.
  - Asegúrate de haber ejecutado los comandos del Firewall.
  - Verifica si tu antivirus tiene un firewall propio que esté bloqueando la conexión.

- **La aplicación carga pero no muestra datos**:
  - Verifica que el Backend esté corriendo.
  - Asegúrate de que la IP en `frontend/.env` sea correcta (`192.168.1.115`).
