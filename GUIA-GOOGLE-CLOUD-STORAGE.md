# 📦 GUÍA COMPLETA - GOOGLE CLOUD STORAGE

**Base URL:** `http://localhost:3002/api/v1/storage`

---

## 🔧 CONFIGURACIÓN INICIAL

### 1. Necesitas proporcionarme:

1. **Service Account JSON** de Google Cloud (archivo `.json`)
2. **Nombre del Bucket** (ejemplo: `nidopro-archivos`)
3. **Project ID** de Google Cloud

### 2. Pasos para obtener las credenciales:

#### A. Crear Service Account en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Ve a **IAM & Admin** → **Service Accounts**
4. Click en **CREATE SERVICE ACCOUNT**
5. Nombre: `nidopro-storage-service`
6. Rol: **Storage Admin** (para acceso completo al bucket)
7. Click en **CREATE KEY** → Formato: **JSON**
8. Descarga el archivo JSON (ejemplo: `nidopro-service-account.json`)

#### B. Crear Bucket de Google Cloud Storage

1. Ve a **Cloud Storage** → **Buckets**
2. Click en **CREATE BUCKET**
3. Nombre: `nidopro-archivos` (debe ser único globalmente)
4. Ubicación: **us-central1** (o la más cercana a Perú)
5. Storage class: **Standard**
6. Access control: **Uniform**
7. Desmarcar **Prevent public access** si quieres URLs públicas
8. Click en **CREATE**

---

## 📝 CONFIGURACIÓN EN EL BACKEND

### 1. Coloca el archivo JSON en tu proyecto

```
NidoPro-BackEnd-NestJS/
├── config/
│   └── google-cloud-credentials.json  ← Archivo descargado
├── src/
├── .env
└── ...
```

### 2. Agrega las variables de entorno a `.env`

```env
# Google Cloud Storage Configuration
GCS_PROJECT_ID=tu-project-id
GCS_KEY_FILE=./config/google-cloud-credentials.json
GCS_BUCKET_NAME=nidopro-archivos
```

**Ejemplo completo:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=NidoPro

# JWT
JWT_SECRET=nidopro_secret_key_2024_dev
PORT=3002

# Google Cloud Storage
GCS_PROJECT_ID=nidopro-backend
GCS_KEY_FILE=./config/google-cloud-credentials.json
GCS_BUCKET_NAME=nidopro-archivos
```

---

## 🚀 ENDPOINTS DISPONIBLES

### 1. **Subir un archivo**

```
POST /storage/upload
Content-Type: multipart/form-data
```

**Body (FormData):**
- `file` (required): Archivo a subir
- `folder` (optional): Carpeta destino (ej: `tareas`, `vouchers`, `planificaciones`)

**Response:**
```json
{
  "success": true,
  "message": "Archivo subido correctamente",
  "data": {
    "url": "https://storage.googleapis.com/nidopro-archivos/tareas/1737339127890-documento.pdf",
    "fileName": "documento.pdf",
    "mimeType": "application/pdf",
    "size": 245678,
    "folder": "tareas"
  }
}
```

---

### 2. **Subir múltiples archivos**

```
POST /storage/upload-multiple
Content-Type: multipart/form-data
```

**Body (FormData):**
- `files` (required): Array de archivos (máximo 10)
- `folder` (optional): Carpeta destino

**Response:**
```json
{
  "success": true,
  "message": "3 archivo(s) subido(s) correctamente",
  "data": {
    "urls": [
      "https://storage.googleapis.com/nidopro-archivos/tareas/1737339127890-doc1.pdf",
      "https://storage.googleapis.com/nidopro-archivos/tareas/1737339127891-doc2.pdf",
      "https://storage.googleapis.com/nidopro-archivos/tareas/1737339127892-doc3.pdf"
    ],
    "count": 3,
    "files": [
      {
        "url": "https://storage.googleapis.com/nidopro-archivos/tareas/1737339127890-doc1.pdf",
        "fileName": "doc1.pdf",
        "mimeType": "application/pdf",
        "size": 123456
      },
      {
        "url": "https://storage.googleapis.com/nidopro-archivos/tareas/1737339127891-doc2.pdf",
        "fileName": "doc2.pdf",
        "mimeType": "application/pdf",
        "size": 234567
      },
      {
        "url": "https://storage.googleapis.com/nidopro-archivos/tareas/1737339127892-doc3.pdf",
        "fileName": "doc3.pdf",
        "mimeType": "application/pdf",
        "size": 345678
      }
    ]
  }
}
```

---

### 3. **Eliminar un archivo**

```
DELETE /storage/delete
Content-Type: application/json
```

**Body:**
```json
{
  "fileUrl": "https://storage.googleapis.com/nidopro-archivos/tareas/1737339127890-documento.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Archivo eliminado correctamente",
  "data": {
    "fileUrl": "https://storage.googleapis.com/nidopro-archivos/tareas/1737339127890-documento.pdf"
  }
}
```

---

### 4. **Obtener URL firmada (Signed URL)**

```
GET /storage/signed-url?fileUrl=https://...&expiresInMinutes=60
```

**Query Params:**
- `fileUrl` (required): URL del archivo
- `expiresInMinutes` (optional): Tiempo de expiración (default: 60)

**Response:**
```json
{
  "success": true,
  "message": "URL firmada generada correctamente",
  "data": {
    "signedUrl": "https://storage.googleapis.com/nidopro-archivos/tareas/doc.pdf?X-Goog-Signature=...",
    "expiresInMinutes": 60,
    "originalUrl": "https://storage.googleapis.com/nidopro-archivos/tareas/doc.pdf"
  }
}
```

---

### 5. **Verificar si un archivo existe**

```
GET /storage/exists?fileUrl=https://storage.googleapis.com/...
```

**Response:**
```json
{
  "success": true,
  "message": "El archivo existe",
  "data": {
    "exists": true,
    "fileUrl": "https://storage.googleapis.com/nidopro-archivos/tareas/doc.pdf"
  }
}
```

---

### 6. **Listar archivos en una carpeta**

```
GET /storage/list/tareas
```

**Response:**
```json
{
  "success": true,
  "message": "15 archivo(s) encontrado(s)",
  "data": {
    "folder": "tareas",
    "count": 15,
    "files": [
      "https://storage.googleapis.com/nidopro-archivos/tareas/1737339127890-doc1.pdf",
      "https://storage.googleapis.com/nidopro-archivos/tareas/1737339127891-doc2.pdf",
      "..."
    ]
  }
}
```

---

### 7. **Listar todos los archivos**

```
GET /storage/list
```

**Response:**
```json
{
  "success": true,
  "message": "50 archivo(s) encontrado(s)",
  "data": {
    "count": 50,
    "files": [
      "https://storage.googleapis.com/nidopro-archivos/tareas/doc1.pdf",
      "https://storage.googleapis.com/nidopro-archivos/vouchers/voucher1.jpg",
      "..."
    ]
  }
}
```

---

## 📂 ESTRUCTURA DE CARPETAS RECOMENDADA

```
nidopro-archivos/
├── tareas/           ← Archivos de tareas de estudiantes
├── vouchers/         ← Comprobantes de pago de matrículas
├── planificaciones/  ← Documentos de planificación docente
├── informes/         ← Informes generados
├── estudiantes/      ← Fotos de estudiantes
├── trabajadores/     ← Documentos de trabajadores
└── general/          ← Archivos misceláneos
```

---

## 🖥️ EJEMPLOS DE CÓDIGO PARA EL FRONTEND

### 1. **Subir un archivo (JavaScript/React)**

```javascript
async function subirArchivo(file, folder = 'tareas') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch('http://localhost:3002/api/v1/storage/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  console.log('Archivo subido:', result.data.url);
  return result.data.url;
}

// Uso:
const inputFile = document.querySelector('#fileInput');
inputFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const url = await subirArchivo(file, 'tareas');
  console.log('URL del archivo:', url);
});
```

---

### 2. **Subir múltiples archivos**

```javascript
async function subirMultiplesArchivos(files, folder = 'tareas') {
  const formData = new FormData();

  for (const file of files) {
    formData.append('files', file);
  }
  formData.append('folder', folder);

  const response = await fetch('http://localhost:3002/api/v1/storage/upload-multiple', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  return result.data.urls;
}

// Uso:
const inputFiles = document.querySelector('#filesInput');
inputFiles.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  const urls = await subirMultiplesArchivos(files, 'tareas');
  console.log('URLs de los archivos:', urls);
});
```

---

### 3. **Eliminar un archivo**

```javascript
async function eliminarArchivo(fileUrl) {
  const response = await fetch('http://localhost:3002/api/v1/storage/delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileUrl }),
  });

  const result = await response.json();
  console.log('Archivo eliminado:', result.success);
  return result.success;
}

// Uso:
await eliminarArchivo('https://storage.googleapis.com/nidopro-archivos/tareas/doc.pdf');
```

---

### 4. **Componente React completo de ejemplo**

```jsx
import React, { useState } from 'react';

function UploadComponent() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'tareas');

    try {
      const response = await fetch('http://localhost:3002/api/v1/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setFileUrl(result.data.url);
      alert('Archivo subido correctamente');
    } catch (error) {
      console.error('Error al subir archivo:', error);
      alert('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Subiendo...' : 'Subir Archivo'}
      </button>

      {fileUrl && (
        <div>
          <p>Archivo subido:</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            {fileUrl}
          </a>
        </div>
      )}
    </div>
  );
}

export default UploadComponent;
```

---

## 🔐 SEGURIDAD

### 1. **Archivos públicos vs privados**

Por defecto, los archivos se hacen públicos automáticamente. Si quieres archivos privados:

- Comenta la línea `await blob.makePublic()` en `storage.service.ts`
- Usa **Signed URLs** para acceso temporal

### 2. **Validación de archivos**

Puedes agregar validación en el frontend:

```javascript
function validarArchivo(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  if (file.size > maxSize) {
    alert('El archivo es demasiado grande (máximo 10MB)');
    return false;
  }

  if (!allowedTypes.includes(file.type)) {
    alert('Tipo de archivo no permitido');
    return false;
  }

  return true;
}
```

---

## 🧪 PRUEBAS CON POSTMAN/THUNDER CLIENT

### Subir archivo:

1. Method: `POST`
2. URL: `http://localhost:3002/api/v1/storage/upload`
3. Body: `form-data`
   - Key: `file` (type: File)
   - Key: `folder` (type: Text, value: `tareas`)
4. Send

---

## ❓ FAQ

### ¿Qué formatos de archivo están soportados?
Todos los formatos. El servicio no tiene restricciones de tipo de archivo.

### ¿Cuál es el tamaño máximo de archivo?
Por defecto no hay límite, pero puedes configurarlo en Multer si lo necesitas.

### ¿Los archivos son públicos?
Sí, por defecto se hacen públicos. Puedes cambiar esto en el servicio.

### ¿Puedo organizar archivos en subcarpetas?
Sí, solo usa la nomenclatura `carpeta/subcarpeta` en el parámetro `folder`.

---

## 📋 CHECKLIST DE CONFIGURACIÓN

- [ ] Crear Service Account en Google Cloud Console
- [ ] Descargar archivo JSON de credenciales
- [ ] Crear Bucket en Google Cloud Storage
- [ ] Colocar archivo JSON en `config/google-cloud-credentials.json`
- [ ] Agregar variables de entorno en `.env`
- [ ] Reiniciar backend
- [ ] Probar endpoint `/storage/upload`

---

**¡Cuando tengas las credenciales, compártelas conmigo y las configuramos juntos!**
