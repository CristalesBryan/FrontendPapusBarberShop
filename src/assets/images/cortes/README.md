# Imágenes de Tipos de Corte

Esta carpeta contiene las imágenes representativas de los diferentes tipos de corte.

## 📋 Imágenes Requeridas

Para que el sistema funcione correctamente, copia las siguientes imágenes desde el proyecto antiguo:

### Desde:
```
Papus BarberShop/resources/img/
```

### Hacia:
```
Pagina BarberShop/Frontend/src/assets/images/cortes/
```

### Archivos a copiar:

1. **Corte de Caballero.png** → `Corte de Caballero.png`
2. **Corte para niño.png** → `Corte para niño.png`
3. **Arreglo de Barba.png** → `Arreglo de Barba.png`
4. **Corte y Barba.png** → `Corte y Barba.png`

## 🚀 Opción Automática

Ejecuta el script PowerShell para copiar automáticamente:

```powershell
cd "Pagina BarberShop/Frontend/src/assets/images/cortes"
.\copiar-imagenes.ps1
```

## 📝 Opción Manual

Si prefieres copiar manualmente:

1. Abre la carpeta: `Papus BarberShop/resources/img/`
2. Copia los 4 archivos PNG mencionados
3. Pégales en: `Pagina BarberShop/Frontend/src/assets/images/cortes/`

## ⚠️ Notas Importantes

- Los nombres de archivo deben coincidir **exactamente** (incluyendo mayúsculas y espacios)
- Si alguna imagen no se encuentra, se mostrará una imagen placeholder
- Las imágenes deben estar en formato PNG o JPG
- Tamaño recomendado: 300x300px o similar

## ✅ Verificación

Después de copiar las imágenes, verifica que existan:
- ✅ `Corte de Caballero.png`
- ✅ `Corte para niño.png`
- ✅ `Arreglo de Barba.png`
- ✅ `Corte y Barba.png`
